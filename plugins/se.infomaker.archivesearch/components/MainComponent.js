import {Component} from 'substance'
import ImageListComponent from './ImageListComponent'
import SearchComponent from './SearchComponent'

/**
 * @class MainComponent
 */
class MainComponent extends Component {

    shouldRerender() {
        return false
    }

    render($$) {
        return $$('div').addClass('im-archivesearch').append(
            $$(SearchComponent, {
                onResult: ({items, totalHits, limit, start, type}) => {
                    this.refs.imageList.extendProps({
                        items,
                        totalHits,
                        limit,
                        start,
                        type
                    })
                },
                clearResult: () => {
                    this.refs.imageList.extendProps({
                        items: [],
                        totalHits: 0,
                        limit: 0,
                        start: 0,
                    })
                }
            }).ref('searchComponent'),
            $$(ImageListComponent, {
                items: [],
                totalHits: 0,
                limit: 0,
                start: 0,
                onPageChange: (pageNumber) => {
                    const pageIndex = pageNumber - 1
                    this.context.api.events.trigger(null, 'archive-search:pageChange', {
                        pageIndex
                    })
                }
            }).ref('imageList')
        )
    }
}

export default MainComponent
