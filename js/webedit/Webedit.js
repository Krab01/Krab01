/** @jsx React.DOM */

/*
 * Represents created page
 */
var Web = React.createClass({

    propTypes: {
        components: React.PropTypes.arrayOf(React.PropTypes.object) // array of page components description
    },

    getDefaultProps: function () {
        return [];
    },

    render: function () {

        var components = _.map(this.props.components, function (component) {
            return Components[component.class]({data: component, key: component.key});
        });

        return <div>{components}</div>;
    }

});

/*
 * Utility class that allows to work with web page components description
 */
var ComponentManager = function (component) {
    if (!(this instanceof ComponentManager)) {
        throw "Use ComponentManager function as constructor"
    }

    if (component) {
        this.components = component;
    }
    else {
        this.components = [];
        this.selectedComponent = null;
    }
    this.counter = 0;
};

ComponentManager.prototype.set = function (component) {
    this.reset();
    this.components = component;
}

ComponentManager.prototype._add = function (component, select) {

    component.children = [];

    component.key = ++this.counter;

    if (Options[component.class]) {
        component.options = {
            metadata: Options[component.class],
            values: []
        };
    }

    if (this.selectedComponent) {
        component.parent = this.selectedComponent;
        this.selectedComponent.children.push(component);
    }
    else {
        component.parent = null;
        this.components.push(component);
    }

    if (select) {
        this.select(component);
    }
}

ComponentManager.prototype.add = function (component) {
    this._add(component, false);
}

ComponentManager.prototype.addAndSelect = function (component) {
    this._add(component, true);
}

ComponentManager.prototype.reset = function () {
    this.selectedComponent = null;
    this.components = [];
}

ComponentManager.prototype.select = function (component) {
    this.selectedComponent = component;
}

ComponentManager.prototype.getSelected = function () {
    return this.selectedComponent;
}

ComponentManager.prototype.getAll = function () {
    return this.components;
}

ComponentManager.prototype.remove = function (component) {
    if (component == this.selectedComponent) {
        this.selectedComponent = null;
    }

    if (component.parent) {
        component.parent.children = _.filter(component.parent.children, function (child) { return child != component });
    }
    else {
        this.components = _.filter(this.components, function (child) { return child != component });
    }

}


var Editor = React.createClass({

    getDefaultProps: function () {
        return {
            width: 800, // default editor width
            contentHeight: 400 // default editor content height (area without toolbars
        }
    },

    propTypes: {
        width: React.PropTypes.number,
        contentHeight: React.PropTypes.number
    },

    /**
     * {
     *  name: string
     *  parent: object/null for root element
     *  key: string
     *  children: array
     *  class: string
     *  options: {
     *      metadata: array
     *      values: {
     *      }
     *  }
     */
    cm: new ComponentManager(),

    toolbars: [],

    addToolbar: function (toolbar) {
        this.toolbars.push(toolbar);
    },

    addComponent: function (component) {
        this.cm.add(component);
        this.forceUpdate();
    },

    removeComponent: function (component) {
        this.cm.remove(component);
        this.forceUpdate();
    },

    selectComponent: function (component) {
        this.cm.select(component);
        this.forceUpdate();
    },

    componentWillMount: function () {
        this.addToolbar(<EditorToolbar editor={this} />);
        this.setState({contentHeight: this.props.contentHeight});
    },

    getEditorNonContentHeight: function () {

        var padding = $(this.refs.wrapper.getDOMNode()).css(['paddingTop', 'paddingBottom']);
        var height = 0;
        _.each(this.toolbars, function (toolbar) { height += $(toolbar.getDOMNode()).outerHeight(true); });
        return parseInt(padding.paddingTop) + parseInt(padding.paddingBottom) + height;

    },

    componentDidMount: function () {
        var self = this;

        
        $(this.getDOMNode()).children('.we-app').children('.we-editor').resizable({
            stop: function (e, ui) {
                self.setState({contentHeight: ui.size.height - self.getEditorNonContentHeight()});
            }
        }).draggable();
    
    },


    render: function () {
        var style = {
            width: this.props.width + 'px'
        };

        return (
            <div>
                <div className="we-app">
                    <div className="we-editor" style={style}>
                        {this.toolbars}
                        <div className="we-editor-container-wrapper" ref="wrapper">
                            <EditorContainer editor={this} height={this.state.contentHeight} />
                        </div>
                    </div>
                </div>
                <Web components={this.cm.getAll()} />
            </div>
            );
    }

});

var EditorContainer = React.createClass({

    componentDidMount: function () {
        $(this.getDOMNode()).slimScroll({height: this.props.height, distance: '4px', size: '8px'});
    },

    componentDidUpdate: function (prevProps) {
        if (prevProps.height != this.props.height)
            $(this.getDOMNode()).slimScroll({destroy: true}).slimScroll({height: 'auto', distance: '4px', size: '8px'});
    },

    changeSelectedComponentName: function (e) {
        this.props.editor.selectedComponent.name = $(e.target).val();
        this.props.editor.forceUpdate();
    },

    render: function () {

        var style = {
            height: this.props.height + 'px'
        };

        var settingsComponents = [];

        var selected = this.props.editor.cm.getSelected();

        if (selected) {
            var metadata = selected.options.metadata;
            var l = metadata.length;

            for (var i = 0; i < l; i++) {
                settingsComponents.push(Components.Options[metadata[i].class]({editor: this.props.editor, key:selected.key + "_" + (i+1), data: selected, metadata: metadata[i]}));
            }

        }

        return (
            <div className="container" style={style}>
                <div className="row">
                    <div className="col-xs-6">{settingsComponents}</div>
                    <div className="col-xs-6">
                        <ComponentTree editor={this.props.editor} components={this.props.editor.cm.getAll()}/>
                    </div>
                </div>
            </div>
            );
    }

});


var Components = {
    H: React.createClass({
        render: function () {
            var heading = this.props.data.options.values['heading'] ? this.props.data.options.values['heading'] : "h1";
            switch (heading) {
                case "h1":
                    return (<h1 style={Styler(this.props.data.options.values)}>{this.props.data.options.values['main'] ? this.props.data.options.values['main'] : this.props.data.name}</h1>);
                case "h2":
                    return (<h2 style={Styler(this.props.data.options.values)}>{this.props.data.options.values['main'] ? this.props.data.options.values['main'] : this.props.data.name}</h2>);
                case "h3":
                    return (<h3 style={Styler(this.props.data.options.values)}>{this.props.data.options.values['main'] ? this.props.data.options.values['main'] : this.props.data.name}</h3>);
            }
        }
    }),

    BGlyphicon: React.createClass({
        render: function () {

            return (<span style={Styler(this.props.data.options.values)} className={"glyphicon " + (this.props.data.options.values['icon'] ? this.props.data.options.values['icon'] : '')}></span>);
        }
    }),

    BPrimaryButton: React.createClass({
        render: function () {
            var className = "btn ";
            className += this.props.data.options.values['button'] ? this.props.data.options.values['button'] : 'btn-primary';
            return (<button type="button" className={className} style={Styler(this.props.data.options.values)}>{this.props.data.options.values['main'] ? this.props.data.options.values['main'] : this.props.data.name}</button>);
        }
    }),

    Div: React.createClass({
        render: function () {

            var children = this.props.data.children;
            var l = children.length;

            var childrens = [];
            for (var i = 0; i < l; i++) {
                var child = Components[children[i].class]({data: children[i], key: children[i].key});
                childrens.push(child);
            }

            return (<div style={Styler(this.props.data.options.values)}>{childrens.length ? childrens : ''}</div>);
        }
    }),

    P: React.createClass({
        render: function () {
            return (<p contenteditable="true" style={Styler(this.props.data.options.values)}>{this.props.data.options.values['body'] ? this.props.data.options.values['body'] : ''}</p>);
        }
    }),

    Row: React.createClass({
        render: function () {

            var children = this.props.data.children;
            var l = children.length;

            var childrens = [];
            for (var i = 0; i < l; i++) {
                var child = Components[children[i].class]({data: children[i], key: children[i].key});
                childrens.push(<div>{child}</div>);
            }

            return (<div className="Row" style={Styler(this.props.data.options.values)}>{childrens.length ? childrens : ''}</div>);
        }
    }),

    Column: React.createClass({
        render: function () {

            var children = this.props.data.children;
            var l = children.length;

            var childrens = [];
            for (var i = 0; i < l; i++) {
                var child = Components[children[i].class]({data: children[i], key: children[i].key});
                childrens.push(<div className="left">{child}</div>);
            }

            return (<div className="Column" style={Styler(this.props.data.options.values)}>{childrens.length ? childrens : ''}<div className="clearfix"></div></div>);
        }
    }),

    BContainer: React.createClass({
        render: function () {

            var children = this.props.data.children;
            var l = children.length;

            var childrens = [];
            for (var i = 0; i < l; i++) {
                var child = Components[children[i].class]({data: children[i], key: children[i].key});
                childrens.push(child);
            }

            return (<div className="container" style={Styler(this.props.data.options.values)}>{childrens.length ? childrens : ''}</div>);
        }
    }),

    BWell: React.createClass({
        render: function () {

            var children = this.props.data.children;
            var l = children.length;

            var childrens = [];
            for (var i = 0; i < l; i++) {
                var child = Components[children[i].class]({data: children[i], key: children[i].key});
                childrens.push(child);
            }


            return (<div className="well" style={Styler(this.props.data.options.values)}>{childrens.length ? childrens : ''}</div>);
        }
    }),

    BRow: React.createClass({
        render: function () {

            var children = this.props.data.children;
            var l = children.length;

            var childrens = [];
            for (var i = 0; i < l; i++) {
                var child = Components[children[i].class]({data: children[i], key: children[i].key});
                childrens.push(child);
            }


            return (<div className="row" style={Styler(this.props.data.options.values)}>{childrens.length ? childrens : ''}</div>);
        }
    }),

    BColumn: React.createClass({
        render: function () {

            var children = this.props.data.children;
            var l = children.length;

            var childrens = [];
            for (var i = 0; i < l; i++) {
                var child = Components[children[i].class]({data: children[i], key: children[i].key});
                childrens.push(child);
            }
            var className = "col-xs-" + (this.props.data.options.values.bcolwidth ? this.props.data.options.values.bcolwidth : 2);

            return (<div className={className} style={Styler(this.props.data.options.values)}>{childrens.length ? childrens : ''}</div>);
        }
    }),

    Options: {

        TextEdit: React.createClass({
            valueChanged: function (e) {
                this.props.data.options.values[this.props.metadata.key] = $(e.target).val();
                this.props.editor.forceUpdate();
            },
            render: function () {
                return (
                    <div>
                        <div>{this.props.metadata.options.label}</div>
                        <input defaultValue={this.props.data.options.values[this.props.metadata.key] ? this.props.data.options.values[this.props.metadata.key] : '' } onChange={this.valueChanged} />
                    </div>
                );
            }
        }),

        RadioGroup: React.createClass({
            valueChanged: function (e) {
                this.props.data.options.values[this.props.metadata.key] = $(e.target).val();
                this.props.editor.forceUpdate();
            },
            render: function () {
                var options = [];
                var options_val = this.props.metadata.options.options;
                for (var option in options_val) {
                    if (options_val.hasOwnProperty(option)) {
                        options.push(<div><input type="radio" checked={(this.props.data.options.values[this.props.metadata.key] && this.props.data.options.values[this.props.metadata.key] == option) ? "checked" : ""} onChange={this.valueChanged} name={this.props.metadata.options.name} value={option}/>{options_val[option]}</div>);
                    }
                }
                return (
                    <div>
                        <div>{this.props.metadata.options.label}</div>
                        {options}
                    </div>
                    );
            }
        }),

        SelectBox: React.createClass({
            valueChanged: function (e) {
                this.props.data.options.values[this.props.metadata.key] = $(e.target).val();
                this.props.editor.forceUpdate();
            },
            render: function () {
                var options = [];
                var options_val = this.props.metadata.options.options;
                for (var option in options_val) {
                    if (options_val.hasOwnProperty(option)) {
                        options.push(<option value={option}>{options_val[option]}</option>);
                    }
                }
                return (
                    <div>
                        <div>{this.props.metadata.options.label}</div>
                        <select defaultValue={this.props.data.options.values[this.props.metadata.key] ? this.props.data.options.values[this.props.metadata.key] : '' } onChange={this.valueChanged}>{options}</select>
                    </div>
                    );
            }
        }),

        BColumnEdit: React.createClass({
            valueChanged: function (e) {
                var newCount = $(e.target).val();
                if (!newCount) return;
                console.log(this.props.data.options.values[this.props.metadata.key]);
                if (!this.props.data.options.values[this.props.metadata.key]) {
                    for (var i = 0; i < newCount; i++) {
                        this.props.editor.addComponent({
                            class: 'BColumn',
                            name: 'Bootstrap column'
                        });
                    }
                }
                else if (this.props.data.options.values[this.props.metadata.key] > newCount) {
                    var removeCount = this.props.data.options.values[this.props.metadata.key] - newCount;
                    for (var i = 0; i < removeCount; i++) {
                        this.props.data.children.pop();
                    }
                }
                else if (this.props.data.options.values[this.props.metadata.key] < newCount) {
                    var addCount = newCount - this.props.data.options.values[this.props.metadata.key];
                    for (var i = 0; i < addCount; i++) {
                        this.props.editor.addComponent({
                            class: 'BColumn',
                            name: 'Bootstrap column'
                        });
                    }
                }
                this.props.data.options.values[this.props.metadata.key] = newCount;
                this.props.editor.forceUpdate();
            },
            render: function () {
                return (
                    <div>
                        <div>{this.props.metadata.options.label}</div>
                        <input defaultValue={this.props.data.options.values[this.props.metadata.key] ? this.props.data.options.values[this.props.metadata.key] : '' } onChange={this.valueChanged} />
                    </div>
                    );
            }
        }),

        P: React.createClass({
            valueChanged: function (e) {
                this.props.data.options.values[this.props.metadata.key] = $(e.target).val();
                this.props.editor.forceUpdate();
            },
            render: function () {
                return (
                    <div>
                        <div>{this.props.metadata.options.label}</div>
                        <textarea defaultValue={this.props.data.options.values[this.props.metadata.key] ? this.props.data.options.values[this.props.metadata.key] : '' } onChange={this.valueChanged} />
                    </div>
                    );
            }
        }),

        RenameEdit: React.createClass({
            valueChanged: function (e) {
                this.props.data.name = $(e.target).val();
                this.props.editor.forceUpdate();
            },
            render: function () {
                return (
                    <div>
                        <div>{this.props.metadata.options.label}</div>
                        <input defaultValue={this.props.data.name} onChange={this.valueChanged} />
                    </div>
                    );
            }
        }),

        Checkbox: React.createClass({
            valueChanged: function (e) {
                this.props.data.options.values[this.props.metadata.key] = $(e.target).prop('checked');
                this.props.editor.forceUpdate();
            },
            render: function () {
                return (
                    <div>
                        <div>{this.props.metadata.options.label}</div>
                        <input type="checkbox" checked={this.props.data.options.values[this.props.metadata.key] ? "checked" : '' } onChange={this.valueChanged} />
                    </div>
                    );
            }
        }),

        MarginEdit: React.createClass({
            marginTopChanged: function (e) {
                this.props.data.options.values[this.props.metadata.key].marginTop = $(e.target).val();
                this.props.editor.forceUpdate();
            },
            marginRightChanged: function (e) {
                this.props.data.options.values[this.props.metadata.key].marginRight = $(e.target).val();
                this.props.editor.forceUpdate();
            },
            marginBottomChanged: function (e) {
                this.props.data.options.values[this.props.metadata.key].marginBottom = $(e.target).val();
                this.props.editor.forceUpdate();
            },
            marginLeftChanged: function (e) {
                this.props.data.options.values[this.props.metadata.key].marginLeft = $(e.target).val();
                this.props.editor.forceUpdate();
            },
            render: function () {
                if (!this.props.data.options.values[this.props.metadata.key]) {
                    this.props.data.options.values[this.props.metadata.key] = {
                        marginTop: "0px",
                        marginRight: "0px",
                        marginBottom: "0px",
                        marginLeft: "0px"
                    }
                }
                return (
                    <div>
                        <div>{this.props.metadata.options.label}</div>
                        <div className="left">
                            <span>Horní:</span>
                            <input className="marginInput" defaultValue={this.props.data.options.values[this.props.metadata.key].marginTop ? this.props.data.options.values[this.props.metadata.key].marginTop : '0px' } onChange={this.marginTopChanged} />
                        </div>
                        <div className="left">
                            <span>Pravý:</span>
                            <input className="marginInput" defaultValue={this.props.data.options.values[this.props.metadata.key].marginRight ? this.props.data.options.values[this.props.metadata.key].marginRight : '0px' } onChange={this.marginRightChanged} />
                        </div>
                        <div className="left">
                            <span>Dolní:</span>
                            <input className="marginInput" defaultValue={this.props.data.options.values[this.props.metadata.key].marginBottom ? this.props.data.options.values[this.props.metadata.key].marginBottom : '0px' } onChange={this.marginBottomChanged} />
                        </div>
                        <div className="left">
                            <span>Levý:</span>
                            <input className="marginInput" defaultValue={this.props.data.options.values[this.props.metadata.key].marginLeft ? this.props.data.options.values[this.props.metadata.key].marginLeft : '0px' } onChange={this.marginLeftChanged} />
                        </div>
                        <div className="clearfix"></div>
                    </div>
                    );
            }
        }),

        PaddingEdit: React.createClass({
            paddingTopChanged: function (e) {
                this.props.data.options.values[this.props.metadata.key].paddingTop = $(e.target).val();
                this.props.editor.forceUpdate();
            },
            paddingRightChanged: function (e) {
                this.props.data.options.values[this.props.metadata.key].paddingRight = $(e.target).val();
                this.props.editor.forceUpdate();
            },
            paddingBottomChanged: function (e) {
                this.props.data.options.values[this.props.metadata.key].paddingBottom = $(e.target).val();
                this.props.editor.forceUpdate();
            },
            paddingLeftChanged: function (e) {
                this.props.data.options.values[this.props.metadata.key].paddingLeft = $(e.target).val();
                this.props.editor.forceUpdate();
            },
            render: function () {
                if (!this.props.data.options.values[this.props.metadata.key]) {
                    this.props.data.options.values[this.props.metadata.key] = {
                        paddingTop: "0px",
                        paddingRight: "0px",
                        paddingBottom: "0px",
                        paddingLeft: "0px"
                    }
                }
                return (
                    <div>
                        <div>{this.props.metadata.options.label}</div>
                        <div className="left">
                            <span>Horní:</span>
                            <input className="marginInput" defaultValue={this.props.data.options.values[this.props.metadata.key].paddingTop ? this.props.data.options.values[this.props.metadata.key].paddingTop : '0px' } onChange={this.paddingTopChanged} />
                        </div>
                        <div className="left">
                            <span>Pravý:</span>
                            <input className="marginInput" defaultValue={this.props.data.options.values[this.props.metadata.key].paddingRight ? this.props.data.options.values[this.props.metadata.key].paddingRight : '0px' } onChange={this.paddingRightChanged} />
                        </div>
                        <div className="left">
                            <span>Dolní:</span>
                            <input className="marginInput" defaultValue={this.props.data.options.values[this.props.metadata.key].paddingBottom ? this.props.data.options.values[this.props.metadata.key].paddingBottom : '0px' } onChange={this.paddingBottomChanged} />
                        </div>
                        <div className="left">
                            <span>Levý:</span>
                            <input className="marginInput" defaultValue={this.props.data.options.values[this.props.metadata.key].paddingLeft ? this.props.data.options.values[this.props.metadata.key].paddingLeft : '0px' } onChange={this.paddingLeftChanged} />
                        </div>
                        <div className="clearfix"></div>
                    </div>
                    );
            }
        }),


    }
};

var Options = {
    Div: [
        {
            class: 'RenameEdit',
            options: {
                label: 'Přejmenovat'
            }
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Barva pozadí:'
            },
            key: 'bgcolor'
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Šířka:'
            },
            key: 'width'
        },
        {
            class: 'Checkbox',
            options: {
                label: 'Centrovat:'
            },
            key: 'center'
        },
        {
            class: 'RadioGroup',
            options: {
                label: 'Zarovnání inline obsahu:',
                name: 'align',
                options: {
                    center: 'Centrovat',
                    left: 'Doleva',
                    right: 'Doprava'
                }
            },
            key: 'align'
        },
    ],
        BGlyphicon: [
            {
                class: 'RenameEdit',
                options: {
                    label: 'Přejmenovat'
                }
            },
            {
                class: 'SelectBox',
                options: {
                    label: 'Ikona',
                    options: {
                        'glyphicon-asterisk': 'Asterisk',
                        'glyphicon-plus': 'Plus',
                        'glyphicon-pencil' : 'Pencil',
                        'glyphicon-user' : 'User',
                        'glyphicon-ok' : 'Ok',
                        'glyphicon-remove' : 'Remove',
                        'glyphicon-star' : 'Star',
                        'glyphicon-envelope' : 'Envelope',
                        'glyphicon-search' : 'Search',
                        'glyphicon-home' : 'Home',
                        'glyphicon-zoom-in' : 'Zoom-in',
                        'glyphicon-zoom-out' : 'Zoom-out',
                        'glyphicon-signal' : 'Signal',
                    }
                },
                key: 'icon'
            },
            {
                class: 'TextEdit',
                options: {
                    label: 'Velikost písma:'
                },
                key: 'fontsize'
            },
        ],
        BWell: [
            {
                class: 'RenameEdit',
                options: {
                    label: 'Přejmenovat'
                }
            },
            {
                class: 'TextEdit',
                options: {
                    label: 'Barva pozadí:'
                },
                key: 'bgcolor'
            } ,
        ],
        BPrimaryButton: [
        {
            class: 'RenameEdit',
            options: {
                label: 'Přejmenovat'
            }
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Nápis'
            },
            key: 'main'
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Šířka:'
            },
            key: 'width'
        },
        {
            class: 'SelectBox',
            options: {
                label: 'Styl tlačítka',
                options: {
                    'btn-primary': 'Primární',
                    'btn-default': 'Defaultní',
                    'btn-success': 'Success',
                    'btn-info': 'Info',
                    'btn-warning': 'Warrning',
                    'btn-danger': 'Danger',
                    'btn-link': 'Link'
                }
            },
            key: 'button'
        },
        {
            class: 'MarginEdit',
            options: {
                label: 'Okraje:'
            },
            key: 'margins'
        },
        {
            class: 'PaddingEdit',
            options: {
                label: 'Výplň:'
            },
            key: 'padding'
        },
    ],

    BColumn: [
        {
            class: 'RenameEdit',
            options: {
                label: 'Přejmenovat'
            }
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Šířka'
            },
            key: 'bcolwidth'
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Barva pozadí:'
            },
            key: 'bgcolor'
        },
        {
            class: 'RadioGroup',
            options: {
                label: 'Zarovnání inline obsahu:',
                name: 'align',
                options: {
                    center: 'Centrovat',
                    left: 'Doleva',
                    right: 'Doprava'
                }
            },
            key: 'align'
        },
    ],
    BRow: [
        {
            class: 'RenameEdit',
            options: {
                label: 'Přejmenovat'
            }
        },
        {
            class: 'BColumnEdit',
            options: {
                label: 'Počet sloupců:'
            },
            key: 'columns'
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Barva pozadí:'
            },
            key: 'bgcolor'
        },
    ],
    BContainer: [
        {
            class: 'RenameEdit',
            options: {
                label: 'Přejmenovat'
            }
        },
    ],
    H: [
        {
            class: 'RenameEdit',
            options: {
                label: 'Přejmenovat'
            }
        },
        {
            class: 'SelectBox',
            options: {
                label: 'Level',
                options: {
                    'h1': 'H1',
                    'h2': 'H2',
                    'h3': 'H3'
                }
            },
            key: 'heading'
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Font'
            },
            key: 'family'
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Nadpis'
            },
            key: 'main'
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Barva'
            },
            key: 'color'
        },
        {
            class: 'MarginEdit',
            options: {
                label: 'Okraje:'
            },
            key: 'margins'
        },
        {
            class: 'RadioGroup',
            options: {
                label: 'Zarovnání textu:',
                name: 'align',
                options: {
                    center: 'Centrovat',
                    left: 'Doleva',
                    right: 'Doprava'
                }
            },
            key: 'align'
        },
    ],

    P: [
        {
            class: 'P',
            options: {
                label: 'Obsah'
            },
            key: 'body'
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Barva písma:'
            },
            key: 'color'
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Barva pozadí:'
            },
            key: 'bgcolor'
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Velikost písma:'
            },
            key: 'fontsize'
        },
        {
            class: 'RadioGroup',
            options: {
                label: 'Zarovnání textu:',
                name: 'align',
                options: {
                    center: 'Centrovat',
                    left: 'Doleva',
                    right: 'Doprava'
                }
            },
            key: 'align'
        },

    ],

    Row: [
        {
            class: 'RenameEdit',
            options: {
                label: 'Přejmenovat'
            }
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Barva pozadí:'
            },
            key: 'bgcolor'
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Šířka:'
            },
            key: 'width'
        },
        {
            class: 'TextEdit',
            options: {
                label: 'Výška:'
            },
            key: 'height'
        },
        {
            class: 'Checkbox',
            options: {
                label: 'Centrovat:'
            },
            key: 'center'
        },
        {
            class: 'RadioGroup',
            options: {
                label: 'Zarovnání inline obsahu:',
                name: 'align',
                options: {
                    center: 'Centrovat',
                    left: 'Doleva',
                    right: 'Doprava'
                }
            },
            key: 'align'
        },
    ],

    Column: [
        {
            class: 'RenameEdit',
            options: {
                label: 'Přejmenovat'
            }
        },
    ]

};

var ComponentTree = React.createClass({

    render: function () {
        if (!this.props.components.length) return (<h3>No components created.</h3>);

        var components = [];

        var l = this.props.components.length;

        for (var i = 0; i < l; i++) {
            components.push(<ComponentTreeItem editor={this.props.editor} key={this.props.components[i].key} data={this.props.components[i]} />);
        }

        return <ul className="list-group">{components}</ul>;
    }

});


var ComponentTreeItem = React.createClass({

    data: null,

    select: function () {
        this.props.editor.selectComponent(this.data);
    },

    closeClick: function () {
        this.props.editor.removeComponent(this.data);
        this.props.editor.forceUpdate();
        return false;
    },

    render: function () {
        this.data = this.props.data;
        var key = this.props.editor.cm.getSelected() ? this.props.editor.cm.getSelected().key : null;
        var classes = "we-editor-component-tree-item-name";
        if (key == this.data.key) classes += " active";
        return (<li className="list-group-item">
            <div onClick={this.select} className={classes}>
                {this.props.data.name}
                <button type="button" className="close" aria-hidden="true" onClick={this.closeClick}>&times;</button>
            </div>
            {this.props.data.children.length ? <ComponentTree editor={this.props.editor} components={this.props.data.children} /> : ''}
        </li>);
    }
});

var EditorToolbar = React.createClass({

    addH: function () {
        this.props.editor.addComponent({
            name: 'H nadpis',
            class: 'H'
        });
    },

    addDiv: function () {
        this.props.editor.addComponent({
            name: 'Div',
            class: 'Div'
        });
    },

    addP: function () {

        this.props.editor.addComponent({
            name: 'Odstavec',
            class: 'P'
        });

    },

    addRow: function () {
        this.props.editor.addComponent({
            name: 'Row layout',
            class: 'Row'
        });
    },

    addColumn: function () {
        this.props.editor.addComponent({
            name: 'Column layout',
            class: 'Column'
        });
    },

    addContainer: function () {
        this.props.editor.addComponent({
            name: 'Bootstrap container',
            class: 'BContainer'
        });
    },

    addBRow: function () {
        this.props.editor.addComponent({
            name: 'Bootstrap row',
            class: 'BRow'
        });
    },

    addBPrimButton: function () {
        this.props.editor.addComponent({
            name: 'Bootstrap primary button',
            class: 'BPrimaryButton'
        });
    },

    addWell: function () {
        this.props.editor.addComponent({
            name: 'Well',
            class: 'BWell'
        });
    },

    addGlyphicon: function () {
        this.props.editor.addComponent({
            name: 'Glyphicon',
            class: 'BGlyphicon'
        });
    },

    render: function () {
        return (
            <div className="we-editor-toolbar">
                <div className="pokus2">
                    <div className="pokus4">
                    <button onClick={this.addH} type="button" className="btn btn-default">H</button>
                    <button onClick={this.addP} type="button" className="btn btn-default">P</button>
                    <button onClick={this.addDiv} type="button" className="btn btn-default">DIV</button>
                    <button onClick={this.addRow} type="button" className="btn btn-default">Row</button>
                    <button onClick={this.addColumn} type="button" className="btn btn-default">Column</button>
                    <button onClick={this.addContainer} type="button" className="btn btn-default">Container</button>
                    <button onClick={this.addBRow} type="button" className="btn btn-default">BRow</button>
                    <button onClick={this.addBPrimButton} type="button" className="btn btn-default">Button</button>
                    <button onClick={this.addWell} type="button" className="btn btn-default">Well</button>
                    <button onClick={this.addGlyphicon} type="button" className="btn btn-default">Glyphicon</button>
                    </div>
                    <div className="pokus3">
                        <div className="btn-group">
                            <button type="button" className="btn btn-primary dropdown-toggle" data-toggle="dropdown">
                            Basic <span className="caret"></span>
                            </button>
                            <ul className="dropdown-menu" role="menu">
                                <li><a href="#">Boostrap</a></li>
                                <li><a href="#">Composed</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            );
    }
});

