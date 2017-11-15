import './scss/image-gallery.scss'
import './scss/image-gallery-toolbox.scss'

import ImageGalleryNode, {INSERT_IMAGE_GALLERY_COMMAND, INSERT_IMAGE_COMMAND} from './ImageGalleryNode'
import ImageGalleryImageNode from './ImageGalleryImageNode'
import ImageGalleryComponent from './components/ImageGalleryComponent'
import InsertImageGalleryTool from './InsertImageGalleryTool'
import InsertImageGalleryCommand from './InsertImageGalleryCommand'
import ImageGalleryConverter from './ImageGalleryConverter'
import InsertImageCommand from './InsertImageCommand'

const ImageGalleryPackage = {
    name: ImageGalleryNode.type,
    id: 'se.infomaker.imagegallery',
    configure(config) {
        
        config.addNode(ImageGalleryNode)
        config.addNode(ImageGalleryImageNode)
        config.addComponent(ImageGalleryNode.type, ImageGalleryComponent)

        config.addContentMenuTopTool(INSERT_IMAGE_GALLERY_COMMAND, InsertImageGalleryTool)
        config.addCommand(INSERT_IMAGE_GALLERY_COMMAND, InsertImageGalleryCommand)
        config.addCommand(INSERT_IMAGE_COMMAND, InsertImageCommand)

        config.addConverter('newsml', ImageGalleryConverter)

        config.addIcon('angle-left', { 'fontawesome': 'fa-angle-left' })
        config.addIcon('angle-right', { 'fontawesome': 'fa-angle-right' })
        config.addIcon('remove', { 'fontawesome': 'fa-times' })

        /* Labels */
        config.addLabel('im-imagegallery.image-gallery-name', {
            'en': 'Image gallery',
            'sv': 'Bildspel'
        })
        config.addLabel('im-imagegallery.insert-image-gallery', {
            'en': 'Insert Image gallery',
            'sv': 'Infoga bildspel'
        })
        config.addLabel('im-imagegallery.dropzone-label', {
            'en': 'Drop image(s) here',
            'sv': 'Dra och släpp bild(er) här'
        })
        config.addLabel('im-imagegallery.generic-caption', {
            'en': 'Generic caption',
            'sv': 'Gemensam bildtext'
        })
        config.addLabel('im-imagegallery.caption-placeholder', {
            'en': 'Caption',
            'sv': 'Bildtext'
        })
    }
}

export default ImageGalleryPackage