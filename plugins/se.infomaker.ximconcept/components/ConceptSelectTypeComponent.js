import { Component } from 'substance'
import ConceptItemIcon from './ConceptItemIconComponent'

class ConceptSelectTypeComponent extends Component {

    render($$){
        const el = $$('div')
            .addClass('concept-select-type-component')

        Object.keys(this.props.config.types).forEach(type => {
            const typeObject = this.props.config.types[type]

            if (typeObject.editable) {
                const icon = $$(ConceptItemIcon, {
                    propertyMap: this.props.propertyMap,
                    item: { ConceptImTypeFull: type }
                })

                const iconWrapper = $$('div').addClass('concept-select-type-icon-wrapper')
                    .append(icon)
                    .append(typeObject.name)
                    .on('click', () => this.selectType(type))

                el.append(iconWrapper)
            }
        })

        return el
    }

    selectType(type) {
        const { item } = this.props
        item[this.props.propertyMap.ConceptImTypeFull] = type

        this.send('dialog:close')

        this.props.typeSelected(item)
    }

    onClose() {

    }

}

export default ConceptSelectTypeComponent