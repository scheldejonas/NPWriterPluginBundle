import {NilUUID, idGenerator} from 'writer'

export default {
    type: 'ximpdf',
    tagName: 'object',

    matchElement: function (el) {
        return el.is('object') && el.attr('type') === 'x-im/pdf'
    },

    import: function (el, node, converter) { // jshint ignore:line

        // Import link - base data
        let linkEl = el.find('links>link')

        let pdfFile = {
            id: idGenerator(),
            type: 'npfile',
            imType: 'x-im/pdf',
            parentNodeId: node.id
        }

        if (el.attr('uuid')) {
            pdfFile.uuid = el.attr('uuid')
        }
        if (linkEl.attr('uri')) {
            pdfFile.uri = linkEl.attr('uri')
        }
        if (linkEl.attr('url')) {
            pdfFile.url = linkEl.attr('url')
        }

        converter.createNode(pdfFile)

        node.pdfFile = pdfFile.id
        node.uri = pdfFile.uri
        node.uuid = pdfFile.uuid

        // Import data
        let dataEl = linkEl.find('data')
        if (dataEl) {
            dataEl.children.forEach(function (child) {
                if (child.tagName === 'text') {
                    node.text = converter.annotatedText(child, [node.id, 'text'])
                }
            })
        }
    },

    export: function (node, el, converter) {
        const $$ = converter.$$;
        const fileNode = node.document.get(node.pdfFile)

        el.removeAttr('data-id')
        el.attr({
            id: node.id,
            uuid: fileNode.id,
            type: 'x-im/pdf'
        })

        const link = $$('link').attr({
            rel: 'self',
            type: 'x-im/pdf',
            uri: node.uri ? node.uri : '',
            uuid: fileNode.uuid ? fileNode.uuid : NilUUID.getNilUUID()
        })

        link.append(
            $$('data').append(
                $$('text').append(
                    (node.text) ? converter.annotatedText([node.id, 'text']) : ''
                )
            )
        )

        el.append(
            $$('links').append(
                link
            )
        )
    }
}
