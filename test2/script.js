/*!ie11CustomProperties.js v2.2.0 | MIT License | https://git.io/fjXMN*/ ! function () {
    'use strict';
    if (!Element.prototype.matches) Element.prototype.matches = Element.prototype.msMatchesSelector;
    var w = window;
    if (!w.c1) w.c1 = {};
    var listeners = [],
        root = document,
        Observer;
    c1.onElement = function (selector, options) {
        if (typeof options === 'function') {
            options = {
                parsed: options
            }
        }
        var listener = {
            selector: selector,
            immediate: options.immediate,
            elements: new WeakMap(),
        };
        if (options.parsed) {
            listener.parsed = function (el) {
                requestAnimationFrame(function () {
                    options.parsed(el);
                });
            };
        }
        var els = root.querySelectorAll(listener.selector),
            i = 0,
            el;
        while (el = els[i++]) {
            listener.elements.set(el, true);
            listener.parsed && listener.parsed.call(el, el);
            listener.immediate && listener.immediate.call(el, el);
        }
        listeners.push(listener);
        if (!Observer) {
            Observer = new MutationObserver(checkMutations);
            Observer.observe(root, {
                childList: true,
                subtree: true
            });
        }
        checkListener(listener);
    };

    function checkListener(listener, target) {
        var i = 0,
            el, els = [];
        target && target.matches(listener.selector) && els.push(target);
        if (loaded) {
            Array.prototype.push.apply(els, (target || root).querySelectorAll(listener.selector));
        }
        while (el = els[i++]) {
            if (listener.elements.has(el)) continue;
            listener.elements.set(el, true);
            listener.parsed && listener.parsed.call(el, el);
            listener.immediate && listener.immediate.call(el, el);
        }
    }

    function checkListeners(inside) {
        var i = 0,
            listener;
        while (listener = listeners[i++]) checkListener(listener, inside);
    }

    function checkMutations(mutations) {
        var j = 0,
            i, mutation, nodes, target;
        while (mutation = mutations[j++]) {
            nodes = mutation.addedNodes, i = 0;
            while (target = nodes[i++]) target.nodeType === 1 && checkListeners(target);
        }
    }
    var loaded = false;
    document.addEventListener('DOMContentLoaded', function () {
        loaded = true;
    });

    function copyProperty(prop, from, to) {
        var desc = Object.getOwnPropertyDescriptor(from, prop);
        Object.defineProperty(to, prop, desc);
    }
    if (!('classList' in Element.prototype)) {
        copyProperty('classList', HTMLElement.prototype, Element.prototype);
    }
}();
! function () {
    'use strict';
    var testEl = document.createElement('i');
    testEl.style.setProperty('--x', 'y');
    if (testEl.style.getPropertyValue('--x') === 'y' || !testEl.msMatchesSelector) return;
    const regFindSetters = /([\s{;])(--([^;}]+:[^;!}]+)(!important)?)/g;
    const regFindGetters = /([{;]\s*)([^;}{]+:[^;}]*var\([^!;}]+)(!important)?/g;
    const regRuleIEGetters = /-ieVar-([^:]+):/g
    const regRuleIESetters = /-ie-([^};]+)/g
    const regHasVar = /var\(/;
    const regPseudos = /:(hover|active|focus|target|:before|:after)/;
    c1.onElement('link[rel="stylesheet"]', {
        immediate: function (el) {
            fetchCss(el.href, function (css) {
                var newCss = rewriteCss(css);
                if (css === newCss) return;
                el.disabled = true;
                var style = document.createElement('style');
                el.parentNode.insertBefore(style, el);
                activateStyleElement(style, newCss);
            });
        }
    });
    c1.onElement('style', {
        immediate: function (el) {
            if (el.hasAttribute('ie-polyfilled')) return;
            var css = el.innerHTML;
            var newCss = rewriteCss(css);
            if (css === newCss) return;
            activateStyleElement(el, newCss);
        }
    });
    c1.onElement('[ie-style]', {
        immediate: function (el) {
            var newCss = rewriteCss('{' + el.getAttribute('ie-style')).substr(1);
            el.style.cssText += ';' + newCss;
            var found = parseRewrittenCss(newCss);
            if (found.getters) addGetterElement(el, found.getters, '%styleAttr');
            if (found.setters) addSetterElement(el, found.setters);
        }
    });

    function rewriteCss(css) {
        css = css.replace(regFindSetters, function ($0, $1, $2, $3, important) {
            return $1 + '-ie-' + (important ? '❗' : '') + $3
        });
        return css.replace(regFindGetters, function ($0, $1, $2, important) {
            return $1 + '-ieVar-' + (important ? '❗' : '') + $2 + '; ' + $2;
        })
    }

    function parseRewrittenCss(cssText) {
        var matchesGetters = cssText.match(regRuleIEGetters);
        if (matchesGetters) {
            var getters = [];
            for (var j = 0, match; match = matchesGetters[j++];) {
                let propName = match.slice(7, -1);
                if (propName[0] === '❗') propName = propName.substr(1);
                getters.push(propName);
            }
        }
        var matchesSetters = cssText.match(regRuleIESetters);
        if (matchesSetters) {
            var setters = {};
            for (var j = 0, match; match = matchesSetters[j++];) {
                let x = match.substr(4).split(':');
                let propName = x[0];
                let propValue = x[1];
                if (propName[0] === '❗') propName = propName.substr(1);
                setters[propName] = propValue;
            }
        }
        return {
            getters: getters,
            setters: setters
        };
    }

    function activateStyleElement(style, css) {
        style.innerHTML = css;
        style.setAttribute('ie-polyfilled', true);
        var rules = style.sheet.rules || style.sheet.cssRules;
        for (var i = 0, rule; rule = rules[i++];) {
            const found = parseRewrittenCss(rule.cssText)
            if (found.getters) addGettersSelector(rule.selectorText, found.getters);
            if (found.setters) addSettersSelector(rule.selectorText, found.setters);
            const media = rule.parentRule && rule.parentRule.media && rule.parentRule.media.mediaText;
            if (media && (found.getters || found.setters)) {
                matchMedia(media).addListener(function () {
                    drawTree(document.documentElement)
                })
            }
        }
    }

    function addGettersSelector(selector, properties) {
        selectorAddPseudoListeners(selector);
        c1.onElement(unPseudo(selector), function (el) {
            addGetterElement(el, properties, selector);
            drawElement(el);
        });
    }

    function addGetterElement(el, properties, selector) {
        el.setAttribute('iecp-needed', true);
        if (!el.ieCPSelectors) el.ieCPSelectors = {};
        for (var i = 0, prop; prop = properties[i++];) {
            const parts = selector.trim().split('::');
            if (!el.ieCPSelectors[prop]) el.ieCPSelectors[prop] = [];
            el.ieCPSelectors[prop].push({
                selector: parts[0],
                pseudo: parts[1] ? '::' + parts[1] : '',
            });
        }
    }

    function addSettersSelector(selector, propVals) {
        selectorAddPseudoListeners(selector);
        c1.onElement(unPseudo(selector), function (el) {
            addSetterElement(el, propVals);
            drawTree(el);
        });
    }

    function addSetterElement(el, propVals) {
        if (!el.ieCP_setters) el.ieCP_setters = {};
        for (var prop in propVals) {
            el.ieCP_setters['--' + prop] = 1;
        }
    }
    const pseudos = {
        hover: {
            on: 'mouseenter',
            off: 'mouseleave'
        },
        focus: {
            on: 'focusin',
            off: 'focusout'
        },
        active: {
            on: 'CSSActivate',
            off: 'CSSDeactivate'
        },
    };

    function selectorAddPseudoListeners(selector) {
        selector = selector.split(',')[0];
        for (var pseudo in pseudos) {
            var parts = selector.split(':' + pseudo);
            if (parts.length > 1) {
                var ending = parts[1].match(/^[^\s]*/);
                let selector = unPseudo(parts[0] + ending);
                const listeners = pseudos[pseudo];
                c1.onElement(selector, function (el) {
                    el.addEventListener(listeners.on, drawTreeEvent);
                    el.addEventListener(listeners.off, drawTreeEvent);
                });
            }
        }
    }
    let CSSActive = null;
    document.addEventListener('mousedown', function (e) {
        setTimeout(function () {
            if (e.target === document.activeElement) {
                var evt = document.createEvent('Event');
                evt.initEvent('CSSActivate', true, true);
                CSSActive = e.target;
                CSSActive.dispatchEvent(evt);
            }
        })
    });
    document.addEventListener('mouseup', function () {
        if (CSSActive) {
            var evt = document.createEvent('Event');
            evt.initEvent('CSSDeactivate', true, true);
            CSSActive.dispatchEvent(evt);
            CSSActive = null;
        }
    });

    function unPseudo(selector) {
        return selector.replace(regPseudos, '').replace(':not()', '');
    }
    var uniqueCounter = 0;

    function _drawElement(el) {
        if (!el.ieCP_unique) {
            el.ieCP_unique = ++uniqueCounter;
            el.classList.add('iecp-u' + el.ieCP_unique);
        }
        if (!el.ieCP_sheet) {
            var tag = document.createElement('style');
            document.head.appendChild(tag);
            el.ieCP_sheet = tag.sheet;
        }
        var style = getComputedStyle(el);
        while (el.ieCP_sheet.rules[0]) el.ieCP_sheet.deleteRule(0);
        for (var prop in el.ieCPSelectors) {
            var important = style['-ieVar-❗' + prop];
            let valueWithVar = important || style['-ieVar-' + prop];
            if (!valueWithVar) continue;
            var value = styleComputeValueWidthVars(style, valueWithVar);
            if (important) value += ' !important';
            for (var i = 0, item; item = el.ieCPSelectors[prop][i++];) {
                if (item.selector === '%styleAttr') {
                    el.style[prop] = value;
                } else {
                    el.ieCP_sheet.insertRule(item.selector + '.iecp-u' + el.ieCP_unique + item.pseudo + ' {' + prop + ':' + value + '}', 0);
                }
            }
        }
    }

    function drawTree(target) {
        if (!target) return;
        var els = target.querySelectorAll('[iecp-needed]');
        if (target.hasAttribute && target.hasAttribute('iecp-needed')) drawElement(target);
        for (var i = 0, el; el = els[i++];) drawElement(el);
    }
    let drawQueue = {};
    let collecting = false;
    let drawing = false;

    function drawElement(el) {
        drawQueue[el.uniqueNumber] = el;
        if (collecting) return;
        collecting = true;
        requestAnimationFrame(function () {
            collecting = false;
            drawing = true;
            for (var nr in drawQueue) _drawElement(drawQueue[nr]);
            requestAnimationFrame(function () {
                drawing = false;
            })
            drawQueue = {};
        })
    }

    function drawTreeEvent(e) {
        drawTree(e.target)
    }
    const regValueGetters = /var\(([^),]+)(\,(.+))?\)/g;

    function styleComputeValueWidthVars(style, valueWithVar) {
        return valueWithVar.replace(regValueGetters, function (full, variable, x, fallback) {
            variable = variable.trim();
            var pValue = style.getPropertyValue(variable);
            if (pValue === '' && fallback !== undefined) pValue = fallback.trim();
            return pValue;
        });
    }
    var observer = new MutationObserver(function (mutations) {
        if (drawing) return;
        for (var i = 0, mutation; mutation = mutations[i++];) {
            if (mutation.attributeName === 'ie-polyfilled') continue;
            if (mutation.attributeName === 'iecp-needed') continue;
            drawTree(mutation.target);
        }
    });
    setTimeout(function () {
        observer.observe(document, {
            attributes: true,
            subtree: true
        });
    })
    var oldHash = location.hash
    addEventListener('hashchange', function (e) {
        var newEl = document.getElementById(location.hash.substr(1));
        if (newEl) {
            var oldEl = document.getElementById(oldHash.substr(1));
            drawTree(newEl);
            drawTree(oldEl);
        } else {
            drawTree(document);
        }
        oldHash = location.hash;
    });
    var descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style');
    var styleGetter = descriptor.get;
    descriptor.get = function () {
        const style = styleGetter.call(this);
        style.owningElement = this;
        return style;
    }
    Object.defineProperty(HTMLElement.prototype, 'style', descriptor);
    var originalGetComputed = getComputedStyle;
    window.getComputedStyle = function (el) {
        var style = originalGetComputed.apply(this, arguments);
        style.computedFor = el;
        return style;
    }
    var CSSStyleDeclarationProto = CSSStyleDeclaration.prototype;
    const regStartingVar = /^--/;
    var original = CSSStyleDeclarationProto.getPropertyValue;
    Object.defineProperty(CSSStyleDeclarationProto, 'getPropertyValue', {
        value: function (property) {
            if (property.match(regStartingVar)) {
                const ieProperty = property.replace(regStartingVar, '-ie-');
                const iePropertyImportant = property.replace(regStartingVar, '-ie-❗');
                let value = this[iePropertyImportant] || this[ieProperty];
                if (this.computedFor) {
                    if (value !== undefined) {
                        if (regHasVar.test(value)) {
                            value = styleComputeValueWidthVars(this, value);
                        }
                    } else {
                        if (!register[property] || register[property].inherits) {
                            let el = this.computedFor.parentNode;
                            while (el.nodeType === 1) {
                                if (el.ieCP_setters && el.ieCP_setters[property]) {
                                    var style = getComputedStyle(el);
                                    var tmpVal = style[iePropertyImportant] || style[ieProperty];
                                    if (tmpVal !== undefined) {
                                        value = tmpVal;
                                        if (regHasVar.test(value)) {
                                            value = styleComputeValueWidthVars(this, value);
                                        }
                                        break;
                                    }
                                }
                                el = el.parentNode;
                            }
                        }
                    }
                }
                if (value === undefined && register[property]) value = register[property].initialValue;
                if (value === undefined) value = '';
                return value;
            }
            return original.apply(this, arguments);
        }
    });
    var originalSetProp = CSSStyleDeclarationProto.setProperty;
    Object.defineProperty(CSSStyleDeclarationProto, 'setProperty', {
        value: function (property, value, prio) {
            if (property.match(regStartingVar)) {
                if (this.owningElement) {
                    const el = this.owningElement;
                    if (!el.ieCP_setters) el.ieCP_setters = {};
                    el.ieCP_setters[property] = 1;
                    drawTree(el);
                }
                property = property.replace(regStartingVar, '-ie-' + (prio === 'important' ? '❗' : ''));
                this.cssText += '; ' + property + ':' + value + ';';
            }
            return originalSetProp.apply(this, arguments);
        }
    });
    if (!window.CSS) window.CSS = {};
    let register = {}
    CSS.registerProperty = function (options) {
        register[options.name] = options;
    }

    function fetchCss(url, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', url);
        request.overrideMimeType('text/css');
        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                callback(request.responseText);
            }
        };
        request.send();
    }
}();