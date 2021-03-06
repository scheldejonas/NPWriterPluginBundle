import {Component, FontAwesomeIcon} from 'substance'
import {UIDropdown} from 'writer'
import {OpenContentClient, QueryBuilder, QueryResponseHelper} from '@infomaker/oc-client'

/**
 * @class SearchComponent
 *

 * @property {Object}   props
 * @property {Function} props.onResult      Callback after search
 * @property {Function} props.clearResult   Callback when SearchComponent wants to clear results
 */
class SearchComponent extends Component {

    getInitialState() {
        return {
            selectedEndpoint: this._configuredEndpoints[0],
            sortings: [],
            query: '',
            sort: '',
            limit: 25,
            start: 0,
            totalHits: 0
        }
    }

    didMount() {
        this.context.api.events.on('archive-search', 'archive-search:pageChange', (event) => {
            this.extendState({
                start: event.data.pageIndex * this.state.limit
            })

            this._doSearch()
        })

        this._loadSortings()
    }

    dispose() {
        this.context.api.events.off('archive-search', 'archive-search:pageChange')
    }

    render($$) {
        return $$('div').append(
            $$('div').addClass('search-container').append(
                $$('form').append(
                    this._renderEndpointPicker($$),
                    this._renderQueryInput($$),
                    this._renderSearchIcon($$)
                ).attr('autocomplete', 'off')
                    .on('submit', (e) => {
                        e.stopPropagation()
                        e.preventDefault()

                        this.extendState({
                            start: 0
                        })

                        // Since extending state rerenders component, do the search after state.start has been reset
                        setTimeout(() => {
                            this._doSearch()
                        }, 100)
                    })
            ),
            $$('div').addClass('search-options').append(
                [this._renderSearchCountInfo($$), ...this._renderSearchOptions($$)]
            )
        )
    }

    /**
     * @param $$
     * @private
     */
    _renderSearchIcon($$) {
        return $$('a')
            .attr('href', '')
            .append(
                $$(FontAwesomeIcon, {
                    icon: this.state.query ? 'fa-times-circle' : 'fa-search'
                }).addClass('search-icon')
            )
            .on('click', (e) => {
                e.preventDefault()
                if (this.state.query) {
                    this._resetQuery()
                }
            })
    }

    /**
     * @returns {Promise<T>}
     * @private
     */
    _loadSortings() {
        const ocClient = new OpenContentClient(this._ocClientConfig)
        return ocClient.getSortings()
            .then(response => this.context.api.router.checkForOKStatus(response))
            .then(response => response.json())
            .then(({sortings}) => {
                const sortingObjects = sortings.map((sorting) => {
                    return {
                        name: sorting.name,
                        field: sorting.sortIndexFields[0].indexField,
                        ascending: sorting.sortIndexFields[0].ascending
                    }
                })

                this.extendState({
                    sortings: sortingObjects,
                    sort: this._getDefaultSort(sortingObjects)
                })
            })
            .catch((err) => {
                console.error(err)
            })
    }

    /**
     * Get name of default sorting
     *
     * @param {object} sortingObjects
     * @returns {string} sortName
     */
    _getDefaultSort(sortingObjects) {
        const defaultSorting = (this._defaultSorting && sortingObjects.length) ?
            sortingObjects.find(sort => sort.name === this._defaultSorting) : false

        return defaultSorting ?
            defaultSorting.name :
            sortingObjects.length ?
            sortingObjects[0].name : ''
    }

    /**
     * @private
     */
    _resetQuery() {
        this.extendState({
            query: '',
            totalHits: 0,
            start: 0
        })
        this.refs.searchInput.val('')
        this.props.clearResult()
    }

    /**
     * @returns {Array}
     * @readonly
     * @private
     */
    get _configuredEndpoints() {
        return this.context.api.getConfigValue('se.infomaker.archivesearch', 'archiveHosts', [])
    }

    /**
     * @returns {string | false}
     * @readonly
     * @private
     */
    get _defaultSorting() {
        return this.context.api.getConfigValue('se.infomaker.archivesearch', 'defaultSorting', false)
    }

    /**
     * @param $$
     * @private
     */
    _renderQueryInput($$) {
        return $$('div').addClass('form-group flexible-label').append(
            $$('input')
                .addClass('form-control archive-search-input')
                .attr({
                    required: 'required',
                    type: 'text',
                    id: 'archivesearch-input',
                    placeholder: this.getLabel('Search...')
                })
                .ref('searchInput')
                .on('keyup', () => {
                    this.extendState({
                        query: this.refs.searchInput.val()
                    })
                }),
            $$('label')
                .attr('for', 'archivesearch-input')
                .append(
                    this.getLabel('Search...')
                )
        )
    }

    /**
     * @param $$
     * @returns {[VirtualElement]}
     * @private
     */
    _renderSearchCountInfo($$) {
        const summed = this.state.start + this.state.limit
        const showing = summed > this.state.totalHits ? this.state.totalHits : summed

        return $$('div').addClass('count-info')
            .append(
                $$('span').text(
                    `${this.getLabel('Showing')} ${(showing)} ${this.getLabel('of')} ${this.state.totalHits}`
                )
            )
    }

    /**
     * @param $$
     * @private
     */
    _renderEndpointPicker($$) {
        const configuredEndpoints = this._configuredEndpoints

        return $$(UIDropdown, {
            options: configuredEndpoints.map(({name: label, name: value}) => {
                return {
                    label,
                    value
                }
            }),
            isSelected: (options, item) => item.label === this.state.selectedEndpoint.name,
            onChangeList: (selectedValue) => {
                const selectedEndpoint = this._configuredEndpoints.find(({name}) => selectedValue === name)
                this.extendState({
                    selectedEndpoint
                })
                this._loadSortings()
                    .then(() => {
                        this._resetQuery()
                    })
            },
            disabled: configuredEndpoints.length <= 1
        })
    }

    /**
     * @returns {[Object]}
     * @private
     */
    get _sortingOptions() {
        return [
            ...this.state.sortings.map(({name: label, name: value}) => {
                return {
                    label,
                    value
                }
            }),
            { label: this.getLabel('Relevance'), value: '' }
        ]
    }

    /**
     * @param $$
     * @returns {[VirtualElement]}
     * @private
     */
    _renderSearchOptions($$) {
        return [
            $$(UIDropdown, {
                header: this.getLabel('Sort'),
                options: this._sortingOptions,
                isSelected: (options, item) => item.value === this.state.sort,
                onChangeList: (selectedValue) => {
                    this.extendState({
                        sort: selectedValue
                    })
                    this._doSearch()
                }
            }).ref('sortOptions').addClass('sort-options'),

            $$(UIDropdown, {
                header: this.getLabel('Show'),
                options: [
                    {label: '25', value: 25},
                    {label: '50', value: 50},
                    {label: '100', value: 100}
                ],
                isSelected: (options, item) => item.value === this.state.limit,
                onChangeList: (selectedValue) => {
                    this.extendState({
                        limit: selectedValue
                    })
                    this._doSearch()
                }
            }).ref('displayOption').addClass('display-options'),
        ]
    }

    /**
     * @returns {*}
     * @private
     */
    get _selectedSorting() {
        const sortObj = this.state.sortings.find(({name}) => name === this.state.sort)
        return sortObj ? sortObj : {field: '', ascending: false}
    }

    /**
     * @returns {Object}
     * @private
     */
    get _query() {
        return Object.assign(this.state.selectedEndpoint.standardQuery, {
            q: this.state.query
        })
    }

    /**
     * @returns {Object}
     * @private
     */
    get _ocClientConfig() {
        return this.state.selectedEndpoint.host
    }

    /**
     * @returns {[String]}
     * @private
     */
    get _ocResponseProperties() {
        const resultMapping = this.state.selectedEndpoint.resultsMapping
        return Object.keys(resultMapping).map(key => resultMapping[key])
    }

    /**
     * Builds query depending on state and config,
     * returns query string
     *
     * @returns {String}
     * @private
     */
    get _builtQuery() {
        const queryBuilder = new QueryBuilder(this._query)

        queryBuilder.setStart(this.state.start)
            .setSorting(this._selectedSorting.field, this._selectedSorting.ascending)
            .setLimit(this.state.limit)
            .setResponseProperties(this._ocResponseProperties)

        return queryBuilder.build()
    }

    /**
     * @private
     */
    _doSearch() {
        if (this.state.query === '') {
            return
        }

        const ocClient = new OpenContentClient(this._ocClientConfig)

        return ocClient.search(this._builtQuery)
            .then(response => this.context.api.router.checkForOKStatus(response))
            .then(response => response.json())
            .then(json => new QueryResponseHelper(json))
            .then((qResponse) => {
                return {
                    totalHits: qResponse.getTotalHits(),
                    includedHits: qResponse.getIncludedHits(),
                    items: this._mapSearchResults(qResponse.getItems())
                }
            })
            .then(json => {
                this.extendState({
                    totalHits: json.totalHits
                })

                // Send result to parent
                this.props.onResult({
                    items: json.items,
                    totalHits: json.totalHits,
                    limit: this.state.limit,
                    start: this.state.start,
                    type: this.state.selectedEndpoint.type
                })
            })
            .catch((e) => console.error(e))
    }

    /**
     * @param items
     * @private
     * @return {[Object]}
     */
    _mapSearchResults(items) {
        const resultMappings = this.state.selectedEndpoint.resultsMapping

        return items.map((versionedItem) => {
            const item = {
                uuid: versionedItem.id
            }

            const itemProperties = versionedItem.versions[0].properties

            Object.keys(resultMappings)
                .filter((key) => Object.keys(itemProperties).includes(resultMappings[key]))
                .forEach((key) => {
                    // Convert { "key": ["value"] } to { "key": "value" }
                    const ocKey = resultMappings[key]
                    item[key] = Array.isArray(itemProperties[ocKey]) ? itemProperties[ocKey][0] : itemProperties[ocKey]
                })

            return item
        })
    }
}

export default SearchComponent
