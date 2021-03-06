import {Component, TextPropertyEditor} from 'substance'

/**
 * @typedef TableCellComponent.Props
 * @property {TableCellNode} node - Reference to the selections TableNode
 * @property {boolean} disabled - True if editing of the cell is disabled
 * @property {boolean} header - True if the cell is a table head cell
 * @property {?string} selectionState - Null, 'focused', or 'selected'
 */

/**
 * Renders a single table cell
 *
 * @class TableCellComponent
 * @extends {Component}
 * @param {TableCellComponent.Props} props
 * @property {TableCellComponent.Props} props
 */
class TableCellComponent extends Component {
    didMount() {
        this.context.editorSession.onRender('document', this._onDocumentChange, this)
    }

    dispose() {
        this.context.editorSession.off(this)
    }

    _onDocumentChange(change) {
        if (change.isAffected([this.props.node.id])) {
            this.rerender()
        }
    }

    shouldRerender(newProps) {
        const headerChanged = this.props.header !== newProps.header
        const selectionStateChanged = this.props.selectionState !== newProps.selectionState
        const metaChanged = this.props.meta !== newProps.meta
        return headerChanged || selectionStateChanged || metaChanged
    }

    render($$) {
        const node = this.props.node
        const {format} = this.props.meta
        const cellType = this.props.header ? 'th' : 'td'
        const classNames = []

        if (this.props.selectionState === 'selected') {
            classNames.push('selected')
        }

        if (this.props.selectionState === 'focused') {
            classNames.push('focused')
        }

        if(format) {
            classNames.push(`${format}-format`)
        }

        const cellAttributes = {
            class: classNames.join(' ')
        }

        if (node.rowspan > 0) { cellAttributes.rowspan = node.rowspan }
        if (node.colspan > 0) { cellAttributes.colspan = node.colspan }

        const editor = $$(TextPropertyEditor, {
            path: node.getTextPath(),
            disabled: this._isDisabled(),
            multiline: false
        }).ref('editor')

        if (this.refs.editor) {
            this.refs.editor._handleEnterKey = this._handleEnterKey.bind(this)
            this.refs.editor._handleTabKey = this._handleTabKey.bind(this)
        }

        return $$(cellType, cellAttributes, [
            editor,
            this._renderCellInfo($$)
        ]).ref('cell')
    }

    /**
     * Renders info about the cell size if it has a rowspan or colspan
     */
    _renderCellInfo($$) {
        const {index, format} = this.props.meta
        const {header} = this.props
        const node = this.props.node
        if (!index && !format && node.rowspan < 2 && node.colspan < 2) {
            return null
        }

        const cellInfo = []
        const rowspan = node.rowspan || 1
        const colspan = node.colspan || 1

        if(rowspan > 1 || colspan > 1) {
            cellInfo.push(`${colspan}x${rowspan}`)
        }
        if(header) {
            cellInfo.push(format, index ? '*' : '')
        }

        return $$('div', {class: `cell-info`}, cellInfo.join(' '))
    }

    /**
     * Disabled state of the cell text property editor
     *
     * We want them to be disabled when they are not focused to prevent selections
     * from getting 'stuck' in them.
     * @private
     */
    _isDisabled() {
        return this.props.disabled || this.props.selectionState !== 'focused'
    }

    /**
     * Overwritten method from TextPropertyEditor
     *
     * If we do not overwrite it, TextPropertyEditor will not propagate the event
     * which is later handled in TableComponent
     * @param {KeyboardEvent} event
     * @private
     */
    _handleEnterKey(event) { // eslint-disable-line
        // console.info('Capturing enter key', event)
        // Not used right now, but leaving it here so cells can handle multiline in the future.
    }

    /**
     * Overwritten method from TextPropertyEditor
     *
     * If we do not overwrite it, TextPropertyEditor will not propagate the event
     * which is later handled in TableComponent
     * @param {KeyboardEvent} event
     * @private
     */
    _handleTabKey(event) { // eslint-disable-line
        // console.info('Capturing tab key', event)
        // Not used right now, but leaving it here so cells can handle it in the future.
    }

    /**
     * Grab focus on a single table cell
     * @param {boolean} selectContents - If the selection should contain all text. If false, puts the cursor at the end of the text
     */
    grabFocus(selectContents=false) {
        let node = this.props.node
        this.context.editorSession.setSelection({
            type: 'property',
            path: node.getPath(),
            startOffset: (selectContents ? 0 : node.getLength()),
            endOffset: node.getLength(),
            surfaceId: this.refs.editor.id
        })
    }
}

TableCellComponent.prototype._isTableCellComponent = true
export default TableCellComponent
