export function isElement(element) {
    return element instanceof Element || element instanceof HTMLDocument;  
}

export function replaceAll(value, str1, str2, ignore) {
    return value.replace(new RegExp(str1.replace(/([/,!\\^${}[\]().*+?|<>\-&])/g, "\\$&"), (ignore ? "gi" : "g")), (typeof (str2) === "string") ? str2.replace(/\$/g, "$$$$") : str2);
}

export function getElm(selector, win) {
    win = win || window;

    var elm = isElement(selector) ? selector : win.document.querySelector(selector);    

    if (elm) {
        extendElement(elm);
    }

    return elm;
}

export function getElms(selector, win) {
    win = win || window;

    var elms = win.document.querySelectorAll(selector);

    elms.forEach(elm => extendElement(elm));

    return elms;
}

function ensurePropValue(obj, propName, defaultVal) {
    if (typeof obj[propName] === 'undefined') {
        obj[propName] = defaultVal;
    }
}

export function addOneShotEventCapabilities(elm) {
    if (elm.oneShotCapable !== true) {
        elm.oneShotEvent = (evt, func, useCapture) => {
            return new Promise(resolve => {
                var oneShot = () => {
                    elm.removeEventListener(evt, oneShot, useCapture);
                    
                    if (typeof func === 'function') {
                        func.apply(elm, arguments);
                    }
                    
                    resolve.apply(this, arguments);
                };
        
                elm.addEventListener(evt, oneShot, useCapture);
            });
        };
    
        elm.oneShotCapable = true;
    }

    return elm;
}

export function extendElement(elm) {
    if (elm.playgroundExtended === true) {
        return elm;
    }

    addOneShotEventCapabilities(elm);

    elm.setStyles = styles => setStyles(elm, styles);

    elm.setCss = css => setCss(elm, css);    

    if (!elm.clearCss) {
        elm.clearCss = () => {
            if (elm.css && elm.css.parentNode) {
                elm.css.parentNode.removeChild(elm.css);
            }
        };
    }

    elm.replaceWith = newElm => {
        if (elm.parentNode) {
            elm.parentNode.insertBefore(newElm, elm);
            elm.parentNode.removeChild(elm);
        }

        return newElm;
    };

    elm.append = (tag, settings, win) => {
        var childElm = isElement(tag) ? tag : newElm(tag, settings, win || window);    

        return elm.appendChild(childElm);
    };

    elm.clearChildren = () => {
        while (elm.firstChild) {
            elm.removeChild(elm.firstChild);
        }
    };

    elm.withId = id => {
        elm.id = id;
        return elm;
    };

    elm.withClassName = className => {
        elm.className = className;
        return elm;
    };

    elm.withType = type => {
        elm.setAttribute("type", type);
        return elm;
    };

    elm.withSrc = src => {
        elm.setAttribute("src", src);
        return elm;
    };

    elm.withAlt = alt => {
        elm.setAttribute("alt", alt);
        return elm;
    };

    elm.withTitle = title => {
        elm.setAttribute("title", title);
        return elm;
    };

    elm.withText = text => {
        elm.appendChild(window.document.createTextNode(text));
        return elm;
    };

    elm.withValue = value => {
        elm.setAttribute('value', value);
        return elm;
    };

    elm.withProps = props => {
        for (var name in props) {
            elm[name] = props[name];            
        }

        return elm;
    };

    elm.withHTML = html => {
        // Caution! - Setting innerHTML overwrites any contents already in the element,
        // so it can cause memory leaks, if not used properly.
        elm.innerHTML = html;

        return elm;
    };

    elm.withStyles = styles => setStyles(elm, styles);
    elm.withCss = css => setCss(elm, css);

    elm.withBackgroundImage = url => {
        elm.style.backgroundImage = `url("${url}")`;
        
        return elm;
    };

    elm.withClickHandler = handler => {
        elm.onclick = () => handler();

        return elm;
    };

    elm.playgroundExtended = true;

    return elm    
}

export function newElm(tag, settings, win) {
    win = win || window;

    var doc = window.document,
    elm = doc.createElement(tag),
    name;

    settings = settings || {};

    for (name in settings.props) {
        elm[name] = settings.props[name];
    }

    for (name in settings.attribs) {
        elm.setAttribute(name, settings.attribs[name]);
    }

    for (name in settings.styles) {
        elm.style[name] = settings.styles[name];
    }

    if (settings.html) {
        elm.innerHTML = settings.html;
    }

    if (settings.text) {
        elm.appendChild(doc.createTextNode(settings.text));
    }
    
    extendElement(elm);

    return elm;
}

export function cssPropNameToJSPropName(propName) {
    return propName.split('-').map((item, index) => {
        return index > 0 ? (item[0].toUpperCase() + item.slice(1)) : item;
    }).join('');
}

export function setStyles(selector, styles) {
    var elm = isElement(selector) ? selector : window.document.querySelector(selector);    

    styles.replace(/\s*([:;])\s*/mg, "$1").trim().split(';').forEach(style => {
        style = style.trim().split(':');
        if (style.length === 2) {
            elm.style[cssPropNameToJSPropName(style[0])] = style[1];
        }           
    });

    return elm;
}

export function setCss(element, newStyle, win) {
    if (element === undefined || element === null) return;

    win = win || window;

    if (!newStyle) {
        newStyle = element;
        element = {};
    }

    var doc = win.document,
    styleElement = doc.head.dynamicStyleSheets;

    if (!styleElement) {
        styleElement = doc.head.dynamicStyleSheets = doc.head.appendChild(newElm("style"));
    }

    if (!element.clearCss) {
        element.clearCss = () => {
            if (element.css && element.css.parentNode) {
                element.css.parentNode.removeChild(element.css);
            }
        };
    }

    element.clearCss();

    element.css = doc.createTextNode(newStyle);
    styleElement.appendChild(element.css);

    return element;
}

export function clearCss(element) {
    if (element === undefined || element === null) return;

    if (typeof element.clearCss === 'function') {
        element.clearCss();
    }
}

export function viewportOffset(element) {
    var top = 0, left = 0;

    do {
        top += element.offsetTop || 0;
        left += element.offsetLeft || 0;

        if (element.offsetParent === document.body) {
            break;
        }
        element = element.offsetParent
    } while (element);

    do {
        if (element.tagName === 'BODY') {
            top -= element.scrollTop || 0;
            left -= element.scrollLeft || 0;
        }
        element = element.offsetParent
    } while (element);

    return { left: left, top: top };
}

var seedUniqueID = 0;
export function getUniqueID () {
    return "id" + (performance.now() + '').replace('.','') + (seedUniqueID++);
}

export function transition(elm, property, valueFrom, valueTo, duration, callback) {
    if (!elm) {
        return;
    }

    var jsProperty = property.split('-').map((item, index) => {
        return index > 0 ? (item[0].toUpperCase() + item.slice(1)) : item
    }).join(''),
        transitionValueBefore = elm.style.transition;

    elm.style[jsProperty] = valueFrom;
    elm.style.transition = property + ' ' + duration;

    var transitionEndCallback = () => {
        elm.removeEventListener('transitionend', transitionEndCallback);
        elm.style.transition = transitionValueBefore;
        if (typeof callback === 'function') {
            callback();
        }
    };

    elm.addEventListener('transitionend', transitionEndCallback);

    requestAnimationFrame(() => {
        if (elm && elm.style) {
            elm.style[jsProperty] = valueTo;
        }
    });
}