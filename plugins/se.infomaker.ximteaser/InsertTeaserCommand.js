import {WriterCommand} from 'writer'

class InsertTeaserCommand extends WriterCommand {
    execute(params, context) {
        const {type, teaserContainerNode} = params
        const {editorSession, api} = context

        const generateTeaserTemplate = api.getPluginModule('se.infomaker.ximteaser.teasertemplate')
        const teaserTemplate = generateTeaserTemplate(type)

        let createdTeaserNode
        editorSession.transaction(tx => {

            const emptyParamNode = tx.create({
                type: 'paragraph',
                content: ''
            })
            teaserTemplate.nodes.push(emptyParamNode.id)

            createdTeaserNode = tx.create(teaserTemplate)
            tx.set([teaserContainerNode.id, 'nodes'], [...teaserContainerNode.nodes, teaserTemplate.id])
        })

        if(createdTeaserNode) {
            return createdTeaserNode.id
        }
    }
}

export default InsertTeaserCommand