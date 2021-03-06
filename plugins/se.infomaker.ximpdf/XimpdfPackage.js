import XimpdfComponent from './XimpdfComponent'
import XimpdfConverter from './XimpdfConverter'
import Ximpdf from './Ximpdf'
import XimpdfFileNode from './XimpdfFileNode'
import InsertPdfsTool from './InsertPdfsTool'
import InsertPdfsCommand from './InsertPdfsCommand'
import DropPdfFile from './DropPdfFile'
import DropPdfUri from './DropPdfUri'
import XimpdfMacro from './XimpdfMacro'
import XimpdfFileProxy from './XimpdfFileProxy'

export default {
    name: 'ximpdf',
    id: 'se.infomaker.ximpdf',
    version: '{{version}}',
    configure: function (config) {
        config.addNode(Ximpdf)
        config.addComponent(Ximpdf.type, XimpdfComponent)
        config.addConverter(XimpdfConverter)
        config.addContentMenuTopTool('insert-pdfs', InsertPdfsTool)
        config.addCommand('insert-pdfs', InsertPdfsCommand)
        config.addNode(XimpdfFileNode)
        config.addDropHandler(new DropPdfFile())
        config.addDropHandler(new DropPdfUri())
        config.addMacro(XimpdfMacro)
        config.addFileProxy(XimpdfFileProxy)

        config.addLabel('Upload PDF document', {
            en: 'Upload PDF document',
            sv: 'Ladda upp PDF-dokument'
        })

        config.addLabel('pdf-error-title', {
            en: 'Error during PDF upload',
            sv: 'Fel vid PDF-uppladdning'
        })

        config.addLabel('pdf-upload-error-message', {
            en: 'The PDF could not be uploaded.',
            sv: 'PDF-filen kunde inte laddas upp.'
        })
    }
}
