'use strict';

import {Component} from 'substance'
import MapComponent from './MapComponent'
import SearchComponent from './SearchComponent'
import {jxon} from 'writer'
import {idGenerator} from 'writer'
import {lodash} from 'writer'

var isArray = lodash.isArray
var isObject = lodash.isObject
var find = lodash.find

class LocationDetailComponent extends Component {

    constructor(...args) {
        super(...args)

        // action handlers
        this.handleActions({
            'googleMapsLoaded': this.googleMapsLoaded,
            'searchItemSelected': this.searchItemSelected,
            'markerPositionChanged': this.markerPositionChanged
        })
    }

    dispose() {
        // TODO Abort on fetch method?
        // if (this.ajaxRequest) {
        //     this.ajaxRequest.abort()
        // }
        Component.prototype.dispose.call(this)
    }

    /**
     * Creates an Id and update the id property on contept.metadata.object.id
     */
    createIdForObject() {
        this.props.location.concept.metadata.object['@id'] = idGenerator()
    }

    createLocation() {
        var location = this.props.location,
            url = '/api/newsitem'

        this.createIdForObject()

        this.saveLocation(url, 'POST').then(data => {
            // Update tag in newsItem
            this.context.api.addLocation(this.name, {
                title: location.concept.name,
                data: this.getGeometryObject(),
                uuid: data,
                type: this.getLocationType()
            })

            this.props.reload()
            this.send('close')
        }).catch (err => console.log(err))
    }

    updateLocation() {
        var location = this.props.location;
        var uuid = location['@guid'] ? location['@guid'] : null
        if (!uuid) {
            throw new Error("ConceptItem has no UUID to update")
        }
        var url = '/api/newsitem/' + uuid

        this.saveLocation(url, 'PUT').then(() => {
            // Update tag in newsItem
            this.context.api.newsItem.updateLocation(this.name, {
                title: location.concept.name,
                data: this.getGeometryObject(),
                uuid: uuid,
                type: this.getLocationType()
            })
            this.props.reload()
            this.send('close')
        }).catch(err => console.log(err));
    }

    getGeometryObject() {
        var geometry = findAttribute(this.props.location, 'geometry')
        if (geometry) {
            return {
                position: this.props.location.concept.metadata.object.data.geometry
            }
        } else {
            return {}
        }
    }

    /**
     * Sets the definition description
     *
     * @param {string} inputValue The form value filled in by user
     * @param {string} role The definition type, drol:short or drol:long
     */
    setDescription(inputValue, role) {
        var currentDescription = this.context.api.concept.getDefinitionForType(this.props.location.concept.definition, role)
        if (inputValue.length > 0 && !currentDescription) {
            var longDesc = {'@role': role, keyValue: inputValue}
            this.props.location.concept.definition = this.conceptUtil.setDefinitionDependingOnArrayOrObject(this.props.location.concept.definition, longDesc)
        } else if (inputValue.length >= 0 && currentDescription) {
            currentDescription['keyValue'] = inputValue
        }
    }


    /**
     * Method that saves conceptItem to backend
     * @param {string} url
     * @param {string} method POST, PUT
     * @returns {*} Returns jQuery ajax promise
     */
    saveLocation(url, method) {
        var location = this.props.location
        location.concept.name = this.refs.locationNameInput.val().length > 0 ? this.refs.locationNameInput.val() : location.concept.name

        var shortDescriptionInputValue = this.refs.locationShortDescInput.val()
        var longDescriptionInputValue = this.refs.locationLongDescText.val()

        // Check if definition exists
        if (!location.concept.definition) {
            location.concept.definition = []
        }

        this.setDescription(shortDescriptionInputValue, 'drol:short')
        this.setDescription(longDescriptionInputValue, 'drol:long')

        this.xmlDoc = jxon.unbuild(location, null, 'conceptItem')
        var conceptItem = this.xmlDoc.documentElement.outerHTML

        switch (method) {
            case "PUT":
                return this.context.api.router.put(url, conceptItem)
            case "POST":
                return this.context.api.router.post(url, conceptItem)
        }

    }

    /**
     * When searchItem is clicked update the map by setting props on MapComponent
     * @param {class} googleLatLng
     */
    searchItemSelected(googleLatLng) {
        this.markerPositionChanged({lat: googleLatLng.lat(), lng: googleLatLng.lng()})
        this.refs.mapComponent.setProps({googleLatLng: googleLatLng})
    }


    /**
     * When Google maps is loaded in MapComponent pass the google instance to searchComponent
     * @param {class} google
     */
    googleMapsLoaded(google) {
        this.google = google

        this.setState({
            googleMapsLoaded: true
        })

        if (this.props.newLocation && this.props.query) { // If there is a new location and there is a query entered show that in map
            this.refs.searchComponent.setProps({google: google, query: this.props.query})
        } else {
            this.refs.searchComponent.setProps({google: google})
        }

    }

    /**
     * Updates the marker on the map by setting props on MapComponent
     */
    updateMapPosition() {
        var latlng = this.getLatLngFromLoadedLocation()
        this.refs.mapComponent.setProps({googleLatLng: new this.google.maps.LatLng(latlng.lat, latlng.lng)})
    }

    updateMapPositionPolygon() {
        var wktPolygon = this.props.location.concept.metadata.object.data.geometry
        this.refs.mapComponent.setProps({isPolygon: true, wktString: wktPolygon})
    }

    /**
     * The lat and long from loaded location
     * @returns {{lat: *, lng: *}}
     */
    getLatLngFromLoadedLocation() {
        var geometry = findAttribute(this.props.location.concept, 'geometry')

        if (!geometry) {
            return {
                lat: 0,
                lng: 0
            }
        }

        var latLongString = /POINT\((\-?[0-9\.\s]+)\)/.exec(geometry)[1].split(' ')
        return {
            lat: latLongString[1],
            lng: latLongString[0]
        }
    }

    markerPositionChanged(latLng) {
        if (!this.props.location.concept.metadata.object.data) {
            this.props.location.concept.metadata.object.data = {}
        }
        this.props.location.concept.metadata.object.data.geometry = "POINT(" + latLng.lng + " " + latLng.lat + ")"
    }

    getDescription(descriptionType) {
        var locationConcept = this.props.location.concept
        if (!locationConcept.definition) {
            return undefined
        }

        if (isArray(locationConcept.definition)) {
            return find(locationConcept.definition, function (definition) {
                return definition['@role'] === descriptionType
            })
        } else if (isObject(locationConcept.definition)) {
            return locationConcept.definition['@role'] === descriptionType ? locationConcept.definition : undefined
        }

    }

    render($$) {

        var location,
            name = this.props.query,
            shortDesc = "",
            longDesc = ""

        if (this.state.googleMapsLoaded) { // wait until google maps is loaded in MapCompontent
            if (this.props.newLocation && !this.props.newLocationLoaded) {
                var locationTemplate = require('./template/concept')
                var parser = new DOMParser();
                var placeXML = parser.parseFromString(locationTemplate.place).firstChild
                location = jxon.build(placeXML)

                this.extendProps({
                    location: location,
                    newLocationLoaded: true
                })
            }
            else {
                name = this.props.location.concept.name

                shortDesc = this.getDescription('drol:short')
                longDesc = this.getDescription('drol:long')

                shortDesc = shortDesc ? shortDesc : ""
                longDesc = longDesc ? longDesc : ""

                if (this.props.location.concept.metadata.object['@type'] === 'x-im/polygon') {
                    console.warn("Edit of polygons is not yet supported")
                    this.searchDisabled = true
                    this.isPolygon = true
                    this.updateMapPositionPolygon()
                }
                else {
                    this.updateMapPosition()
                }
            }
        }
        var el = $$('div')

        var formContainer = $$('form').addClass('location-form__container clearfix').ref('formContainer').on('submit', function (e) {
            e.preventDefault()
            if (this.refs['locationNameInput'].val() !== "") {
                this.onClose('save')
            }
        }.bind(this))

        var hiddenSubmitButtonToEnableEnterSubmit = $$('input').attr({type: 'submit', style: 'display:none'})
        formContainer.append(hiddenSubmitButtonToEnableEnterSubmit)

        // Name
        var formGroup = $$('fieldset').addClass('form-group col-xs-6').ref('formGroupName')
        formGroup.append($$('label').attr('for', 'locationNameInput').append(this.getLabel('Name')))
        if (this.props.editable) {
            var locationName = $$('input').attr({
                type: 'text',
                id: 'locationNameInput'
            })
                .addClass('form-control').val(name)
                .ref('locationNameInput')

            locationName.on('change', function () {
                if (this.refs['locationNameInput'].val() === "") {
                    this.send("dialog:disablePrimaryBtn")
                } else {
                    this.send("dialog:enablePrimaryBtn")
                }
            }.bind(this))

            formGroup.append(locationName)
        }
        else {
            formGroup.append(
                $$('p').append(name).ref('locationNameP')
            )
        }
        formContainer.append(formGroup)


        // Short Desc
        var formGroupShortDesc = $$('fieldset').addClass('form-group col-xs-6').ref('formGroupShortDesc')
        formGroupShortDesc.append($$('label').attr('for', 'locationShortDescInput').append(this.getLabel('Short description')))
        if (this.props.editable) {
            formGroupShortDesc.append(
                $$('input').attr({
                    id: 'locationShortDescInput'
                })
                    .addClass('form-control')
                    .val(shortDesc['keyValue'])
                    .ref('locationShortDescInput')
            )
        }
        else {
            formGroupShortDesc.append(
                $$('p').append(shortDesc['keyValue']).ref('locationShortDescP')
            )
        }
        formContainer.append(formGroupShortDesc)

        // Long desc
        var formGroupLongDesc = $$('fieldset').addClass('form-group col-xs-12').ref('formGroupLongDesc')
        formGroupLongDesc.append($$('label').attr('for', 'locationLongDescText').append(this.getLabel('Long description')))
        if (this.props.editable) {
            formGroupLongDesc.append(
                $$('textarea').attr({
                    id: 'locationLongDescText'
                })
                    .addClass('form-control')
                    .val(longDesc['keyValue'])
                    .ref('locationLongDescText')
            )
        }
        else {
            formGroupLongDesc.append(
                $$('p').append(longDesc['keyValue']).ref('locationLongDescP')
            )
        }
        formContainer.append(formGroupLongDesc)


        el.append(formContainer)

        if (this.props.exists) {
            el.append($$('div').addClass('pad-top').append(
                $$('div').addClass('alert alert-info').append(this.getLabel("Please note that this name is already in use") + ": " + this.props.query)))
        }

        if (!this.searchDisabled) {
            var searchComponent = $$(SearchComponent).ref('searchComponent')
            el.append(searchComponent)
        }
        if (this.isPolygon) {
            el.append($$('p').addClass('col-xs-12 not-supported').append(this.getLabel('Edit of polygons is not currently supported')))
        }

        var mapComponent = $$(MapComponent).ref('mapComponent')
        el.append(mapComponent)

        return el
    }

    onClose(status) {
        if ('cancel' === status || this.props.editable === false) {
            return true
        }

        if (this.props.newLocation) {
            this.createLocation()
        } else {
            this.updateLocation()
        }

        return false
    }

    getLocationType() {
        var useGeometryType = this.context.api.getConfigValue('se.infomaker.ximplace', 'useGeometryType')
        if (useGeometryType) {
            var locationType = ''
            try {
                if (typeof(this.props.location.concept.metadata.object['@type']) !== 'undefined') {
                    locationType = this.props.location.concept.metadata.object['@type']
                }
            }
            catch (ex) {
                console.error(ex)
                throw new Error('Invalid conceptItem for location')
            }

            if (locationType) {
                return locationType
            }
            else {
                throw new Error('Invalid conceptItem for location. Missing object type')
            }
        }
        else {
            return 'x-im/place'
        }
    }
}


function findAttribute(object, attribute) {
    var match

    function iterateObject(target, name) {
        Object.keys(target).forEach(function (key) {
            if (isObject(target[key])) {
                iterateObject(target[key], name)
            } else if (key === name) {
                match = target[key]
            }
        })
    }

    iterateObject(object, attribute)

    return match ? match : undefined
}


export default LocationDetailComponent