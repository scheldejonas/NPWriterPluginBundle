import {documentHelpers} from 'substance'
import {WriterCommand, idGenerator, api} from 'writer'

class InsertTeaserImageCommand extends WriterCommand {

    execute(params, context) {
        const activeTeaserNode = context.doc.get(params.data.activeTeaserId)
        const {imageEntity, tx} = params.data
        const imageEntityType = this._getImageEntityType(imageEntity)

        if(imageEntityType === 'file') {
            this.handleNewImage(tx, imageEntity, activeTeaserNode, context)
        } else if(imageEntityType === 'node') {
            this.handleNodeDrop(tx, imageEntity, activeTeaserNode, context)
        } else if(imageEntityType === 'uri') {
            const uri = imageEntity.data.uris[0]
            const dropData = this.getDataFromURL(uri)

            if(dropData) {
                // Handles uri drop from related content
                this.handleUriDrop(tx, dropData, activeTeaserNode)
            } else if (this._isImage(uri)){
                // Handles external URL drops
                this.handleUrlDrop(tx, uri, activeTeaserNode)
                setTimeout(() => {
                    api.editorSession.fileManager.sync()
                }, 300)
            }
        }
    }

    _getImageEntityType(imageEntity) {
        if (this.isFileDropOrUpload(imageEntity.data)) {
            // Handle file drop or upload
            return 'file'
        } else if (imageEntity.nodeDrag) {
            // Handle internal node drag
            return 'node'
        } else if (this.isUriDrop(imageEntity.data)) {
            return 'uri'
        }
    }

    _isImage(uri) {

        // Load allowed filextension from config file
        let fileExtensionsFromConfig = api.getConfigValue('se.infomaker.ximimage', 'imageFileExtension')

        // If no extension specified in config use the default extension, specified in constructor
        if (!fileExtensionsFromConfig) {
            fileExtensionsFromConfig = ['jpeg', 'jpg', 'gif', 'png']
        }

        // Iterate given extension and return bool if found
        return fileExtensionsFromConfig.some((extension) => {
            return uri.indexOf(extension) > 0
        })

    }

    getDataFromURL(url) {
        const queryParamKey = 'data='
        const dataPosition = url.indexOf(queryParamKey)
        if(dataPosition > -1) {
            let encodedData = url.substr(dataPosition + queryParamKey.length, url.length)
            return JSON.parse(decodeURIComponent(encodedData))
        } else {
            return false
        }
    }

    /**
     * This handles drops of nodes of type ximimage.
     * It retrieves the imageNode and extracts that fileNode and make a copy of it
     * The crops is removed, uri is changed to used to one from the ImageNode
     * The imageFile.id
     *
     * @param tx
     * @param dragState
     * @param teaserNode
     * @param context
     */
    handleNodeDrop(tx, dragState, teaserNode, context) {
        if (dragState.sourceSelection) {
            try {
                const draggedNodeId = dragState.sourceSelection.nodeId
                const doc = context.editorSession.getDocument()
                const draggedNode = doc.get(draggedNodeId)
                if (draggedNode && draggedNode.type === 'ximimage') {
                    const imageFile = draggedNode.imageFile
                    const imageNode = doc.get(imageFile)
                    const newFileNode = documentHelpers.copyNode(imageNode)[0]
                    newFileNode.parentNodeId = teaserNode.id
                    delete newFileNode.id
                    let imageFileNode = tx.create(newFileNode)
                    tx.set([teaserNode.id, 'imageFile'], imageFileNode.id)
                    tx.set([teaserNode.id, 'uri'], draggedNode.uri)
                    tx.set([teaserNode.id, 'crops'], [])
                    tx.set([teaserNode.id, 'height'], draggedNode.height)
                    tx.set([teaserNode.id, 'width'], draggedNode.width)
                }
            } catch (_) {

            }
        }
    }

    /**
     * @param tx
     * @param dropData
     * @param teaserNode
     */
    handleUriDrop(tx, dropData, teaserNode) {
        teaserNode.shouldDownloadMetadataForImageUri = true // ?
        // Fetch the image
        const uuid = dropData.uuid

        if (!dropData.uuid) {
            throw new Error('Unsupported data. UUID must exist')
        }

        const imageFileNode = {
            parentNodeId: teaserNode.id,
            type: 'npfile',
            imType: 'x-im/image',
            uuid: uuid,
            sourceUUID: uuid,
        }

        // Create file node for the image
        let imageFile = tx.create(imageFileNode)

        tx.set([teaserNode.id, 'imageFile'], imageFile.id)

    }

    /**
     * @param tx
     * @param url
     * @param teaserNode
     */
    handleUrlDrop(tx, url, teaserNode) {
        const nodeId = idGenerator()

        const imageFileNode = {
            parentNodeId: teaserNode.id,
            type: 'npfile',
            imType: 'x-im/image'
        }
        imageFileNode['sourceUrl'] = url

        // Create file node for the image
        let imageFile = tx.create(imageFileNode)

        tx.set([teaserNode.id, 'imageFile'], imageFile.id)

        return nodeId
    }

    /**
     * This method is used when a file is dropped on top of the teaser
     * It will create a fileNode and update the teasernode with
     * the filenode property, all done in a provided transaction
     * @param tx
     * @param dragState
     * @param teaserNode
     * @param context
     */
    handleNewImage(tx, dragState, teaserNode, context) {
        const file = dragState.data.files[0] // Teaser only supports one image, take the first one
        // TODO: we need to get the file instance through to the
        // real document
        let imageFile = tx.create({
            parentNodeId: teaserNode.id,
            type: 'npfile',
            imType: 'x-im/image',
            mimeType: file.type,
            sourceFile: file
        })

        tx.set([teaserNode.id, 'imageFile'], imageFile.id)
        // HACK: fileUpload will be done by CollabSession
        setTimeout(() => {
            context.editorSession.fileManager.sync()
        }, 300)
    }

    isFileDropOrUpload(dragData) {
        return dragData.files && dragData.files.length > 0
    }

    isUriDrop(dragData) {
        if (dragData.uris && dragData.uris.length > 0) {
            return true
        }
        return false
    }
}

export default InsertTeaserImageCommand