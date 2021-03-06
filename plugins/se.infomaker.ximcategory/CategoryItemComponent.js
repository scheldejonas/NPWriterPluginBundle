import {Component, FontAwesomeIcon as Icon} from 'substance'
import {api, jxon, lodash as _, UITooltip} from 'writer'
import CategoryInfo from './CategoryInfoComponent';

class CategoryItemComponent extends Component {

    constructor(...args) {
        super(...args)
        this.name = 'conceptcategory'
    }

    loadTag(item) {
        api.router.getConceptItem(
            item.uuid,
            item.type
        )
        .then(xml => {
            const conceptXML = xml.querySelector('conceptItem'),
                conceptItemJSON = jxon.build(conceptXML)

            this.extendState({
                loadedItem: conceptItemJSON,
                isLoaded: true
            })
        })
        .catch(() => {
            this.extendState({
                isLoaded: true,
                couldNotLoad: true
            })
        })
    }

    render($$) {
        const tagItem = $$('li')
                .addClass('tag-list__item')
                .ref('tagItem'),
            displayNameEl = $$('span')
                .addClass('tag-item__title tag-item__title--no-avatar')
                .attr('title', this.getLabel('Category'))

        if (!this.state.isLoaded) {
            this.loadTag(this.props.item)

            return tagItem.append(
                displayNameEl
                    .addClass('tag-item__title--notexisting')
                    .append(this.props.item.title)
            )
        }

        if (this.state.couldNotLoad) {
            displayNameEl
                .addClass('tag-item__title--notexisting')
                .append(this.props.item.title)
        }
        else {
            let displayName = this.props.item.title

            displayNameEl
                .append(displayName)
                .attr('title', displayName)

            this.updateTagItemName(displayNameEl, this.state.loadedItem)

            displayNameEl
                .on('click', () => {
                    this.showInfo(displayName)
                })
                .append($$(UITooltip, {title: displayName, parent: this}).ref('tooltip'))
                .on('mouseenter', this.toggleTooltip)
                .on('mouseout', this.hideTooltip)

        }

        tagItem.append([
            displayNameEl,
            $$('span').append($$(Icon, {icon: 'fa-times'})
                .addClass('tag-icon tag-icon--delete')
                .attr('title', this.getLabel('Remove from article')))
                .on('click', () => {
                    this.removeTag(this.props.item)
                }),
            $$(Icon, {icon: 'fa-folder'})
                .addClass('tag-icon')
        ])

        return tagItem;
    }

    toggleTooltip() {
        this.refs.tooltip.extendProps({
            show: true
        })
    }

    hideTooltip() {
        this.refs.tooltip.extendProps({
            show: false
        })
    }

    updateTagItemName(tagItem, loadedTag) {
        if (!loadedTag.concept || loadedTag.concept.definition) {
            return
        }

        const definition = _.isArray(loadedTag.concept.definition) ? loadedTag.concept.definition : [loadedTag.concept.definition];
        for (let i = 0; i < definition.length; i++) {
            const item = definition[i];

            if (item["@role"] === "drol:short") {
                if (item["keyValue"] && item["keyValue"].length > 0) {
                    tagItem.attr('title', item["keyValue"])
                    break
                }
            }
        }
    }

    showInfo(title) {
        api.ui.showDialog(
            CategoryInfo, {
                item: this.state.loadedItem,
                reload: this.closeFromDialog.bind(this)
            },
            {
                title: title,
                global: true,
                secondary: false
            }
        )
    }

    /**
     * Called when edit and info dialog is closed
     */
    closeFromDialog() {
        this.loadTag(this.props.item) // Reload new changes
        this.props.reload()
    }

    /**
     * Remove tag after fading item away
     * @param tag
     */
    removeTag(tag) {
        this.props.removeItem(tag)
    }
}

export default CategoryItemComponent
