import {documentHelpers} from 'substance'
import {WriterCommand, idGenerator, api} from 'writer'

class InsertTeaserImageCommand extends WriterCommand {

    execute(params, context) {
        if(params.tx) {
            this._handleInsert(params.tx, params)
        } else {
            context.editorSession.transaction((tx) => this._handleInsert(tx, params))
        }
    }

    _handleInsert(tx, params) {
        const activeTeaserNode = params.context.node
        const {data} = params

        switch(data.type) {
            case 'file':
                this._insertFileImage(tx, data.file, activeTeaserNode)
                break;
            case 'node':
                this._insertNodeImage(tx, data.sourceSelection, activeTeaserNode)
                break;
            case 'uri':
                this._insertUriImage(tx, data.uriData, activeTeaserNode)
                break;
            case 'url':
                this._insertUrlImage(tx, data.url, activeTeaserNode)
                setTimeout(() => {
                    api.editorSession.fileManager.sync()
                }, 300)
                break;
        }
    }

    /**
     * This handles drops of nodes of type ximimage.
     * It retrieves the imageNode and extracts that fileNode and make a copy of it
     * The crops is removed, uri is changed to used to one from the ImageNode
     * The imageFile.id
     *
     * @param tx
     * @param sourceSelection
     * @param teaserNode
     * @param context
     */
    _insertNodeImage(tx, sourceSelection, teaserNode) {
        if (sourceSelection) {
            try {
                const draggedNodeId = sourceSelection.nodeId
                const doc = api.editorSession.getDocument()
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
     * @param uriData
     * @param teaserNode
     */
    _insertUriImage(tx, uriData, teaserNode) {
        teaserNode.shouldDownloadMetadataForImageUri = true // ?
        // Fetch the image
        const uuid = uriData.uuid

        if (!uriData.uuid) {
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
    _insertUrlImage(tx, url, teaserNode) {
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
     * @param file
     * @param teaserNode
     */
    _insertFileImage(tx, file, teaserNode) {
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
            api.editorSession.fileManager.sync()
        }, 300)
    }
}

export default InsertTeaserImageCommand