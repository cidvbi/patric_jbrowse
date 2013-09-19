/**
 * Mixin with methods for parsing making default feature detail dialogs.
 */
define([
            'dojo/_base/declare',
            'dojo/_base/array',
            'dojo/_base/lang',
            'dojo/aspect',
            'dojo/dom-construct',
            'JBrowse/Util',
            'JBrowse/View/FASTA',
            'JBrowse/View/_FeatureDescriptionMixin'
        ],
        function(
            declare,
            array,
            lang,
            aspect,
            domConstruct,
            Util,
            FASTAView,
            FeatureDescriptionMixin
        ) {

return declare( FeatureDescriptionMixin, {

    constructor: function() {

        // clean up the eventHandlers at destruction time if possible
        if( typeof this.destroy == 'function' ) {
            aspect.before( this, 'destroy', function() {
                delete this.eventHandlers;
            });
        }
    },

    _setupEventHandlers: function() {
        // make a default click event handler
        var eventConf = dojo.clone( this.config.events || {} );
        if( ! eventConf.click ) {
            eventConf.click = (this.config.style||{}).linkTemplate
                    ? { action: "newWindow", url: this.config.style.linkTemplate }
                    : { action: "contentDialog",
                        /*title: '{type} {name}',*/ title:'&nbsp;',
                        content: dojo.hitch( this, 'defaultFeatureDetail' ) };
        }

		if ( ! eventConf.mouseover ) {
			eventConf.mouseover = { action: "tooltip", msg: this.config.tooltip };
		}

        // process the configuration to set up our event handlers
        this.eventHandlers = (function() {
            var handlers = dojo.clone( eventConf );
            // find conf vars that set events, like `onClick`
            for( var key in this.config ) {
                var handlerName = key.replace(/^on(?=[A-Z])/, '');
                if( handlerName != key )
                    handlers[ handlerName.toLowerCase() ] = this.config[key];
            }
            // interpret handlers that are just strings to be URLs that should be opened
            for( key in handlers ) {
                if( typeof handlers[key] == 'string' )
                    handlers[key] = { url: handlers[key] };
            }
            return handlers;
        }).call(this);
        this.eventHandlers.click = this._makeClickHandler( this.eventHandlers.click );
		this.eventHandlers.mouseover = this._makeMouseOverHandler( this.eventHandlers.mouseover );
    },

    /**
     * Make a default feature detail page for the given feature.
     * @returns {HTMLElement} feature detail page HTML
     */
    defaultFeatureDetail: function( /** JBrowse.Track */ track, /** Object */ f, /** HTMLElement */ featDiv, /** HTMLElement */ container ) {
        container = container || dojo.create('div', { className: 'detail feature-detail feature-detail-'+track.name.replace(/\s+/g,'_').toLowerCase(), innerHTML: '' } );

        //this._renderCoreDetails( track, f, featDiv, container );
        this._renderPATRICDetails( track, f, featDiv, container );

        //this._renderAdditionalTagsDetail( track, f, featDiv, container );

        this._renderUnderlyingReferenceSequence( track, f, featDiv, container );

        //this._renderSubfeaturesDetail( track, f, featDiv, container );

        return container;
    },

    _renderPATRICDetails: function( track, f, featDiv, container ) {
        var coreDetails = dojo.create('div', { className: 'core', innerHTML: '<h2 class="sectiontitle">Feature Details</h2>' }, container );
	
		var coreInfo = "";
		coreInfo = "<a href=\"Feature?cType=feature&amp;cId=" + f.get("id") + "\" target=_blank>" + f.get("locus_tag");
		if (f.get("refseq") != undefined && f.get("refseq") != "") {
			coreInfo += " | " + f.get("refseq");
		}
		if (f.get("gene") != undefined && f.get("gene") != "") {
			 coreInfo += " | " + f.get("gene");
		}
		coreInfo += "</a>";
		
		if (f.get("product") != "") {
			coreInfo += "<br>" + f.get("product");
		}
		coreInfo += "<br>" + f.get("type") + ": " + f.get("start_str") + " .. " + f.get("end") + " (" + f.get("strand_str") + ")";
		        	
		domConstruct.create('div', {className: 'detail value', innerHTML: coreInfo}, coreDetails );

		if (track.name == "PATRICGenes" && f.get("type") == "CDS") {
			var atElement = domConstruct.create('div', { className: 'additional', innerHTML: '<h2 class="sectiontitle">For this feature, view:</h2>' }, container );
			var xtrnalHtml = "";
			xtrnalHtml += "<a href=\"GenomeBrowser?cType=feature&cId=" + f.get("id") + "&loc=" + (f.get("start")-1000) + ".." + (f.get("end")+1000) + "&tracks=DNA,PATRICGenes\" target=_blank>Genome Browser</a>";
			xtrnalHtml += " &nbsp; <a href=\"CompareRegionViewer?cType=feature&cId=" + f.get("id") + "&tracks=&regions=5&window=10000&loc=1..10000\" target=_blank>Compare Region Viewer</a>";
			xtrnalHtml += " &nbsp; <a href=\"PathwayTable?cType=feature&cId=" + f.get("id") + "\" target=_blank>Pathways</a>";
			xtrnalHtml += " &nbsp; <a href=\"TranscriptomicsGeneExp?cType=feature&cId=" + f.get("id") + "&sampleId=&colId=&log_ratio=&zscore=\" target=_blank>Transcriptomics Data</a>";
			xtrnalHtml += "<br><a href=\"TranscriptomicsGeneCorrelated?cType=feature&cId=" + f.get("id") + "\" target=_blank>Correlated genes</a>";
			domConstruct.create('div', {className:'detail value', innerHTML: xtrnalHtml}, atElement );
		}
    },

    _renderCoreDetails: function( track, f, featDiv, container ) {
        var coreDetails = dojo.create('div', { className: 'core' }, container );
        var fmt = dojo.hitch( this, 'renderDetailField', coreDetails );
        coreDetails.innerHTML += '<h2 class="sectiontitle">Primary Data</h2>';

        fmt( 'Name', this.getFeatureLabel( f ) );
        fmt( 'Type', f.get('type') );
        fmt( 'Score', f.get('score') );
        fmt( 'Description', this.getFeatureDescription( f ) );
        fmt(
            'Position',
            Util.assembleLocString({ start: f.get('start'),
                                     end: f.get('end'),
                                     ref: this.refSeq.name,
                                     strand: f.get('strand')
                                   })
        );
        fmt( 'Length', Util.addCommas(f.get('end')-f.get('start'))+' bp' );
    },

    // render any subfeatures this feature has
    _renderSubfeaturesDetail: function( track, f, featDiv, container ) {
        var subfeatures = f.get('subfeatures');
        if( subfeatures && subfeatures.length ) {
            this._subfeaturesDetail( track, subfeatures, container );
        }
    },

    _isReservedTag: function( t ) {
        return {name:1,start:1,end:1,strand:1,note:1,subfeatures:1,type:1,score:1}[t.toLowerCase()];
    },

    // render any additional tags as just key/value
    _renderAdditionalTagsDetail: function( track, f, featDiv, container ) {
        var additionalTags = array.filter( f.tags(), function(t) {
            return ! this._isReservedTag( t );
        },this);

        if( additionalTags.length ) {
            var atElement = domConstruct.create(
                'div',
                { className: 'additional',
                  innerHTML: '<h2 class="sectiontitle">Attributes</h2>'
                },
                container );
            array.forEach( additionalTags.sort(), function(t) {
                this.renderDetailField( container, t, f.get(t) );
            }, this );
        }
    },

    _renderUnderlyingReferenceSequence: function( track, f, featDiv, container ) {

        // render the sequence underlying this feature if possible
        //var field_container = dojo.create('div', { className: 'field_container feature_sequence' }, container );
        //dojo.create( 'h2', { className: 'field feature_sequence', innerHTML: 'Region sequence', title: 'reference sequence underlying this '+(f.get('type') || 'feature') }, field_container );
		var field_container = dojo.create('div', { className: 'additional' }, container );
		dojo.create( 'h2', { className: 'sectiontitle', innerHTML: 'NA Sequence', title: 'reference sequence underlying this '+(f.get('type') || 'feature') }, field_container );
        var valueContainerID = 'feature_sequence'+this._uniqID();
        var valueContainer = dojo.create(
            'div', {
                id: valueContainerID,
                innerHTML: '<div style="height: 12em">Loading...</div>',
                className: 'value feature_sequence'
            }, field_container);
        var maxSize = this.config.maxFeatureSizeForUnderlyingRefSeq;
        if( maxSize < (f.get('end') - f.get('start')) ) {
            valueContainer.innerHTML = 'Not displaying underlying reference sequence, feature is longer than maximum of '+Util.humanReadableNumber(maxSize)+'bp';
        } else {
             track.browser.getStore('refseqs', dojo.hitch(this,function( refSeqStore ) {
                 valueContainer = dojo.byId(valueContainerID) || valueContainer;
                 if( refSeqStore ) {
                     refSeqStore.getReferenceSequence(
                         { ref: this.refSeq.name, start: f.get('start'), end: f.get('end')},
                         // feature callback
                         dojo.hitch( this, function( seq ) {
                             valueContainer = dojo.byId(valueContainerID) || valueContainer;
                             valueContainer.innerHTML = '';
                             // the HTML is rewritten by the dojo dialog
                             // parser, but this callback may be called either
                             // before or after that happens.  if the fetch by
                             // ID fails, we have come back before the parse.
                             var textArea = new FASTAView({ width: 58, htmlMaxRows: 10 })
                                                .renderHTML(
                                                    { ref:   this.refSeq.name,
                                                      start: f.get('start'),
                                                      end:   f.get('end'),
                                                      strand: f.get('strand'),
                                                      type: f.get('type')
                                                    },
                                                    f.get('strand') == -1 ? Util.revcom(seq) : seq,
                                                    valueContainer
                                                );
                       }),
                       // end callback
                       function() {},
                       // error callback
                       dojo.hitch( this, function() {
                           valueContainer = dojo.byId(valueContainerID) || valueContainer;
                           valueContainer.innerHTML = '<span class="ghosted">reference sequence not available</span>';
                       })
                     );
                 } else {
                     valueContainer.innerHTML = '<span class="ghosted">reference sequence not available</span>';
                 }
             }));
        }
    },

    _uniqID: function() {
        this._idCounter = this._idCounter || 0;
        return this._idCounter++;
    },

    _subfeaturesDetail: function( track, subfeatures, container ) {
            var field_container = dojo.create('div', { className: 'field_container subfeatures' }, container );
            dojo.create( 'h2', { className: 'field subfeatures', innerHTML: 'Subfeatures' }, field_container );
            var subfeaturesContainer = dojo.create( 'div', { className: 'value subfeatures' }, field_container );
            array.forEach( subfeatures || [], function( subfeature ) {
                    this.defaultFeatureDetail(
                        track,
                        subfeature,
                        null,
                        dojo.create('div', {
                                        className: 'detail feature-detail subfeature-detail feature-detail-'+track.name+' subfeature-detail-'+track.name,
                                        innerHTML: ''
                                    }, subfeaturesContainer )
                    );
            },this);
    }

});
});