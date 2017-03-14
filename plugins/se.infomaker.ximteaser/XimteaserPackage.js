import './scss/ximteaser.scss'
import XimteaserComponent from './XimteaserComponent'
import XimteaserConverter from './XimteaserConverter'
import Ximteaser from './Ximteaser'
import XimteaserTool from './XimteaserTool'
import XimteaserCommand from './XimteaserCommand'
import XimteaserInsertImageCommand from './XimteaserInsertImageCommand'

import {platform} from 'substance'
export default {
    name: 'ximteaser',
    id: 'se.infomaker.ximteaser',
    version: '{{version}}',
    configure: function (config, pluginConfig) {
        config.addNode(Ximteaser)
        config.addComponent(Ximteaser.type, XimteaserComponent)
        config.addConverter('newsml', XimteaserConverter)

        config.addContentMenuTopTool('ximteaser', XimteaserTool)
        config.addCommand('ximteaser', XimteaserCommand, pluginConfig)

        config.addCommand('ximteaserinsertimage', XimteaserInsertImageCommand, pluginConfig)

        config.addIcon('ximteaser', { 'fontawesome': ' fa-newspaper-o' })


        if (platform.isMac) {
            config.addKeyboardShortcut('cmd+alt+t', { command: 'ximteaser' })
        } else {
            config.addKeyboardShortcut('ctrl+alt+t', { command: 'ximteaser' })
        }

        config.addLabel('Insert Teaser', {
            en: 'Insert Teaser',
            sv: 'Infoga puff'
        })
        config.addLabel('teaser-add-image', {
            en: 'Add image',
            sv: 'Lägg till bild'
        })
        config.addLabel('teaser-replace-image', {
            en: 'Replace image',
            sv: 'Ersätt bild'
        })
    }
}