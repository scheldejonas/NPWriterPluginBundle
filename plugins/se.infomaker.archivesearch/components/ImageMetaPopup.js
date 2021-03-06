import {Component, FontAwesomeIcon} from 'substance'
import ImageMetaDisplay from './ImageMetaDisplay'

class ImageMetaPopup extends Component {

    render($$) {
        const imageMetaItem = this.props.imageItem
        if (imageMetaItem) {
            return $$('div').addClass('image-meta')
                .css('top', this.props.position.top + 15).append(
                    $$('div').addClass('image-meta-popover-arrow')
                        .css('left', this.props.position.left),
                    $$(FontAwesomeIcon, {icon: 'fa-times'})
                        .addClass('image-meta-close')
                        .on('click', () => {
                            this.extendProps({
                                imageItem: null
                            })
                        }),
                    this._renderImageThumb($$),
                    $$('div').addClass('image-meta-content').append(
                        $$('p').append(this._description),
                        $$('p').append(this._fullCredit)
                    )
                )
        } else {
            return $$('span').css('display', 'none')
        }
    }

    /**
     * @returns {String}
     * @private
     */
    get _description() {
        const {caption} = this.props.imageItem
        return caption ? caption : this.getLabel('Missing image description')
    }

    /**
     *
     * @returns {string}
     * @private
     */
    get _fullCredit() {
        const {credit, source} = this.props.imageItem
        return [credit, source].filter(str => str).join('/')
    }

    /**
     * @param $$
     * @private
     * @return {VirtualElement}
     */
    _renderImageThumb($$) {
        return $$('div').addClass('image-meta-thumb').append(
            $$('img').attr('src', this.props.imageItem.thumbnail),
            $$('button').addClass('btn')
                .append(this.getLabel('Show Image'))
                .on('click', (e) => {
                    e.preventDefault()

                    this.context.api.ui.showDialog(
                        ImageMetaDisplay,
                        {
                            imageItem: this.props.imageItem
                        },
                        {
                            global: true,
                            primary: false,
                            secondary: this.getLabel('Close'),
                            cssClass: 'modal-dialog-full'
                        }
                    )

                })
        )
    }
}

export default ImageMetaPopup
