import {Component} from 'substance'
import {AuthorSuggestionComponent} from './AuthorSuggestionComponent'

class AuthorDialogComponent extends Component {

    constructor(...args) {
        super(...args)

        this.addAuthor = this.addAuthor.bind(this)
        this.overrideEscapeButton = this.overrideEscapeButton.bind(this)
        this.setNewSuggestionList = this.setNewSuggestionList.bind(this)
        document.addEventListener('keydown', this.overrideEscapeButton, true)
    }

    getInitialState() {
        return {
            suggestions: [],
            loading: false
        }
    }

    didMount() {
        this.props.setReloadFunction(this.setNewSuggestionList)
        this.extendState({
            suggestions: this.props.suggestions
        })
    }

    dispose() {
        document.removeEventListener('keydown', this.overrideEscapeButton, true)
    }

    overrideEscapeButton(e) {
        const { keyCode, key } = e
        if (keyCode === 27 || key === 'Escape') { // Escape
            e.stopPropagation()
            e.preventDefault()
            return false
        }
    }

    setNewSuggestionList(suggestions) {
        this.extendState({ suggestions, loading: false })
    }

    addAuthor(author) {
        this.send('dialog:close')
        this.props.addImidUserToArticleByline(author)
    }

    render($$) {
        const { suggestions } = this.state
        const { supportEmail, loading } = this.props
        const renderedSuggestions = suggestions.map(suggestion => $$(AuthorSuggestionComponent, {
            ...this.props,
            addAuthor: this.addAuthor,
            suggestion
        }))

        const supportEmailEl = supportEmail ? $$('a', { class: 'user-author-support', href: `mailto:${supportEmail}` }, ` ${supportEmail}`) : ''

        const suggestionHeader = $$('h4', { class: 'user-author-suggestion-info' },
            !suggestions.length ?
                this.getLabel('We could not find an author matching current user account') :
                suggestions.length === 1 ?
                    this.getLabel('Is this you?') :
                    this.getLabel('Are you one of these authors?')
        )

        const explanation = !suggestions.length ? $$('p', { class: 'user-author-sub-info' }, this.getLabel('We need this to automatically set your byline.')) : ''

        const severalMatchesInfo = renderedSuggestions.length > 1 ?
            $$('p', { class: 'user-author-sub-info' }, this.getLabel('There are several authors with the same email as you. Please select the one that is you.')) : ''

        const authorSubInfo = renderedSuggestions.length ?
            $$('p', { class: 'user-author-sub-info' }, this.getLabel('Selected author will be associated with current user account. You only have to do this once.')) : ''

        const supportInfo = $$('p', { class: 'user-support-info' }, this.getLabel('For assistance please contact your support department.'))

        const suggestionsWrapper = $$('div', { class: 'user-author-suggestions-list-wrapper' },
            (renderedSuggestions.length && !loading) ? $$('ul', { class: 'user-author-suggestions-list' },
                ...renderedSuggestions
            ) : '',
        )

        return $$('div', { class: 'user-author-suggestions-wrapper' }, [
            suggestionHeader,
            explanation,
            severalMatchesInfo,
            authorSubInfo,
            supportInfo,
            supportEmailEl,
            suggestionsWrapper,
        ]).on('keydown', this.overrideEscapeButton)
    }

    onClose() {
        return true
    }

}

export {AuthorDialogComponent}
