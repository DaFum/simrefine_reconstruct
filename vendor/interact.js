/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).interact=e()}(this,(function(){"use strict";/**
 * Gibt die eigenen Eigenschaftsnamen und -symbole eines Objekts zurück, optional nur die aufzählbaren.
 * 
 * @param {Object} obj - Das Quellobjekt, dessen eigenen Eigenschafts-Schlüssel ermittelt werden sollen.
 * @param {boolean} [enumerableOnly] - Wenn `true`, werden nur aufzählbare Symbol-Eigenschaften eingeschlossen.
 * @returns {(string|symbol)[]} Ein Array mit den Eigenschaftsnamen (Strings) und -symbolen des Objekts.
 */
function t(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,r)}return n}/**
 * Kopiert Eigenschaften aus einem oder mehreren Quellobjekten in ein Zielobjekt und gibt dieses zurück.
 *
 * Eigenschaften werden sowohl über String- als auch Symbol-Schlüssel übernommen. Wenn unterstützt, werden die ursprünglichen Property-Deskriptoren beibehalten; andernfalls werden nur aufzählbare Eigenschaften kopiert.
 *
 * @param {Object} target - Das Zielobjekt, in das die Eigenschaften geschrieben werden.
 * @param {...Object} sources - Ein oder mehrere Quellobjekte, deren Eigenschaften kopiert werden.
 * @returns {Object} Das modifizierte Zielobjekt `target`.
 */
function e(e){for(var n=1;n<arguments.length;n++){var r=null!=arguments[n]?arguments[n]:{};n%2?t(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):t(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}/**
 * Bestimmt den JavaScript-Typ eines Werts und erkennt dabei auch `symbol` korrekt.
 * @param {*} t - Der zu prüfende Wert.
 * @returns {string} Der `typeof`-String des Werts, z. B. "string", "number", "object", "symbol".
 */
function n(t){return n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},n(t)}/**
 * Prüft, ob der Wert `t` eine Instanz von `e` ist und wirft andernfalls einen TypeError.
 * @param {*} t - Zu prüfendes Objekt.
 * @param {Function} e - Erwarteter Konstruktor oder Prototyp.
 * @throws {TypeError} Wenn `t` keine Instanz von `e` ist; Fehlermeldung: "Cannot call a class as a function".
 */
function r(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}/**
 * Definiert mehrere Eigenschaften auf dem Zielobjekt und normalisiert fehlende Deskriptorfelder.
 *
 * Für jede Eintragung in `props` wird `enumerable` standardmäßig auf `false` gesetzt und
 * `configurable` auf `true`. Ist ein `value` im Deskriptor vorhanden, wird zusätzlich
 * `writable` auf `true` gesetzt. Die Eigenschaftsbezeichnung wird aus `key` des Deskriptors
 * übernommen (vor der tatsächlichen Definition intern weiterverarbeitet).
 *
 * @param {Object} target - Das Objekt, auf dem die Eigenschaften definiert werden.
 * @param {Array<Object>} props - Array von Eigenschaftsdeskriptoren; jedes Objekt sollte ein `key`
 *   sowie beliebige Property-Descriptor-Felder (`value`, `get`, `set`, `enumerable`, `writable`, `configurable`) enthalten.
 */
function i(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,d(r.key),r)}}/**
 * Fügt Eigenschaften zum Prototyp (Instanzmethoden) und zur Konstruktorfunktion (statische Eigenschaften) hinzu und macht das Prototype-Feld schreibgeschützt.
 * @param {Function} t - Die zu erweiternde Konstruktorfunktion.
 * @param {Object} [e] - Eigenschaftsbeschreibungen, die dem Prototype von `t` hinzugefügt werden.
 * @param {Object} [n] - Eigenschaftsbeschreibungen, die direkt auf `t` gesetzt werden.
 * @returns {Function} Die erweiterte Konstruktorfunktion `t`.
 */
function o(t,e,n){return e&&i(t.prototype,e),n&&i(t,n),Object.defineProperty(t,"prototype",{writable:!1}),t}/**
 * Normalisiert den Eigenschaftsschlüssel, setzt die Eigenschaft auf dem Zielobjekt und gibt das Objekt zurück.
 * Wenn die Eigenschaft bereits im Objekt oder dessen Prototype existiert, wird sie mit den Deskriptoreigenschaften
 * enumerable, configurable und writable auf den angegebenen Wert gesetzt; sonst erfolgt eine einfache Zuweisung.
 * @param {Object} t - Das Zielobjekt, auf dem die Eigenschaft gesetzt wird.
 * @param {string|number|symbol} e - Der Eigenschaftsschlüssel (wird vor dem Setzen normalisiert).
 * @param {*} n - Der zu setzende Wert.
 * @returns {Object} Das modifizierte Zielobjekt.
 */
function a(t,e,n){return(e=d(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}/**
 * Richtet die Prototyp-Vererbung so ein, dass der Konstruktor `t` von `e` erbt.
 * Legt dabei das Prototype-Objekt von `t` auf eine Instanz von `e` und setzt die `constructor`-Eigenschaft; schreibgeschütztes Prototype wird festgelegt und, falls `e` vorhanden ist, die Prototyp-Verknüpfung zum Superkonstruktur hergestellt.
 * @param {Function} t - Der Kind-Konstruktor, dessen Prototyp auf `e` gesetzt wird.
 * @param {Function|null} e - Der Super-Konstruktor oder `null`.
 * @throws {TypeError} Wenn `e` weder eine Funktion noch `null` ist.
 */
function s(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&l(t,e)}/**
 * Gibt das Prototyp-Objekt des angegebenen Objekts zurück.
 * @param {Object} t - Das Objekt, dessen Prototyp ermittelt werden soll.
 * @returns {Object|null} Das Prototyp-Objekt von `t` oder `null`, wenn kein Prototyp vorhanden ist.
 */
function c(t){return c=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},c(t)}/**
 * Setzt das Prototypobjekt eines Zielobjekts.
 * @param {Object} t - Das Zielobjekt, dessen Prototyp gesetzt wird.
 * @param {Object|null} e - Das Prototypobjekt oder `null`.
 * @returns {Object} Das modifizierte Zielobjekt.
 */
function l(t,e){return l=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},l(t,e)}/**
 * Validiert, dass eine Instanzreferenz initialisiert ist und gibt sie zurück.
 * @param {*} t - Die Instanz (meistens `this`), die geprüft und zurückgegeben wird.
 * @returns {*} Die unveränderte Instanzreferenz.
 * @throws {ReferenceError} Wenn die Instanzreferenz `undefined` ist (z. B. weil `super()` nicht aufgerufen wurde).
 */
function u(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}/**
 * Erzeugt eine Hilfsfunktion, die in abgeleiteten Klassen das Aufrufen des Basiskonstruktors korrekt behandelt.
 * 
 * @param {Function} t - Der Basiskonstruktor (Superklasse), dessen Konstruktion aufgerufen werden soll.
 * @returns {Function} Eine Funktion, die innerhalb eines abgeleiteten Konstruktors ausgeführt wird und den Basiskonstruktor mit Unterstützung für Reflect.construct aufruft; sie gibt das korrekt initialisierte Instanzobjekt zurück.
 */
function p(t){var e=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}();return function(){var n,r=c(t);if(e){var i=c(this).constructor;n=Reflect.construct(r,arguments,i)}else n=r.apply(this,arguments);return function(t,e){if(e&&("object"==typeof e||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return u(t)}(this,n)}}/**
 * Liest den Wert einer Eigenschaft vom Objekt oder dessen Prototypenkette und wendet bei Bedarf den übergebenen Receiver für Getter an.
 * @param {Object} t - Das Zielobjekt, von dem die Eigenschaft gelesen werden soll.
 * @param {string|symbol} e - Der Name oder das Symbol der Eigenschaft.
 * @param {Object} [n] - Optionaler Receiver, der als `this` für Getter verwendet wird.
 * @returns {*} Der gelesene Eigenschaftswert oder `undefined`, falls die Eigenschaft nicht existiert.
 */
function f(){return f="undefined"!=typeof Reflect&&Reflect.get?Reflect.get.bind():function(t,e,n){var r=function(t,e){for(;!Object.prototype.hasOwnProperty.call(t,e)&&null!==(t=c(t)););return t}(t,e);if(r){var i=Object.getOwnPropertyDescriptor(r,e);return i.get?i.get.call(arguments.length<3?t:n):i.value}},f.apply(this,arguments)}/**
 * Konvertiert einen Wert zu einem primitiven String oder Symbol.
 * @param {*} t - Der zu konvertierende Wert.
 * @returns {string|symbol} Ein `Symbol`, falls die interne ToPrimitive-Umwandlung ein Symbol liefert, sonst die String-Repräsentation des Werts.
 */
function d(t){var e=function(t,e){if("object"!=typeof t||null===t)return t;var n=t[Symbol.toPrimitive];if(void 0!==n){var r=n.call(t,e||"default");if("object"!=typeof r)return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==typeof e?e:e+""}var h=function(t){return!(!t||!t.Window)&&t instanceof t.Window},v=void 0,g=void 0;/**
 * Setzt die aktive Window-/Document-Referenz und ersetzt sie durch ihr Wrapper-Objekt, falls erforderlich.
 *
 * @param {Window|Object} t - Window-ähnliches Objekt mit einer `document`-Eigenschaft; wird durch `t.wrap(t)` ersetzt, wenn ein erzeugter Textknoten auf ein anderes `ownerDocument` verweist und `t.wrap` das erwartete Wrapper-Objekt zurückgibt.
 */
function m(t){v=t;var e=t.document.createTextNode("");e.ownerDocument!==t.document&&"function"==typeof t.wrap&&t.wrap(e)===e&&(t=t.wrap(t)),g=t}/**
 * Liefert das Window-Objekt, das mit dem übergebenen Element, Dokument oder Window verknüpft ist.
 * 
 * @param {(Window|Document|Element)} t - Ein Window, Document oder DOM-Element.
 * @returns {Window} Das zu `t` gehörige Window; wenn `t` bereits ein Window ist, wird es zurückgegeben. Falls kein zugehöriges Window gefunden wird, wird das globale Fallback-Window verwendet.
 */
function y(t){return h(t)?t:(t.ownerDocument||t).defaultView||g.window}"undefined"!=typeof window&&window&&m(window);var b=function(t){return!!t&&"object"===n(t)},x=function(t){return"function"==typeof t},w={window:function(t){return t===g||h(t)},docFrag:function(t){return b(t)&&11===t.nodeType},object:b,func:x,number:function(t){return"number"==typeof t},bool:function(t){return"boolean"==typeof t},string:function(t){return"string"==typeof t},element:function(t){if(!t||"object"!==n(t))return!1;var e=y(t)||g;return/object|function/.test("undefined"==typeof Element?"undefined":n(Element))?t instanceof Element||t instanceof e.Element:1===t.nodeType&&"string"==typeof t.nodeName},plainObject:function(t){return b(t)&&!!t.constructor&&/function Object\b/.test(t.constructor.toString())},array:function(t){return b(t)&&void 0!==t.length&&x(t.splice)}};/**
 * Sperrt bei einem vorbereiteten Drag die Bewegung entlang der gesperrten Achse, indem die aktuellen Koordinaten auf die Startkoordinaten zurückgesetzt und die Geschwindigkeit auf dieser Achse auf 0 gesetzt wird.
 * 
 * Verändert nur dann die Interaktionsdaten, wenn `t.interaction.prepared.name` den Wert `"drag"` hat. Bei `prepared.axis === "x"` werden y-Koordinaten und y-Geschwindigkeiten zurückgesetzt; bei `prepared.axis === "y"` werden x-Koordinaten und x-Geschwindigkeiten zurückgesetzt.
 * 
 * @param {Object} t - Kontextobjekt, das das Feld `interaction` enthält ( erwartet ein Interaction-Objekt mit `prepared`, `coords.start`, `coords.cur` und `coords.velocity` ).
 */
function E(t){var e=t.interaction;if("drag"===e.prepared.name){var n=e.prepared.axis;"x"===n?(e.coords.cur.page.y=e.coords.start.page.y,e.coords.cur.client.y=e.coords.start.client.y,e.coords.velocity.client.y=0,e.coords.velocity.page.y=0):"y"===n&&(e.coords.cur.page.x=e.coords.start.page.x,e.coords.cur.client.x=e.coords.start.client.x,e.coords.velocity.client.x=0,e.coords.velocity.page.x=0)}}/**
 * Setzt bei einem Drag mit festgelegter Achse die Koordinate senkrecht zur Achse auf den Startwert und setzt deren Delta auf 0.
 * @param {Object} t - Eingabeobjekt mit Event- und Interaktionsdaten.
 * @param {Object} t.iEvent - Das normalisierte Eventobjekt; erwartet die Felder `page`, `client` und `delta`, jeweils Objekte mit `x`/`y`.
 * @param {Object} t.interaction - Die aktuelle Interaction; erwartet `prepared.name`, `prepared.axis` und `coords.start.page` / `coords.start.client`.
 */
function T(t){var e=t.iEvent,n=t.interaction;if("drag"===n.prepared.name){var r=n.prepared.axis;if("x"===r||"y"===r){var i="x"===r?"y":"x";e.page[i]=n.coords.start.page[i],e.client[i]=n.coords.start.client[i],e.delta[i]=0}}}var S={id:"actions/drag",install:function(t){var e=t.actions,n=t.Interactable,r=t.defaults;n.prototype.draggable=S.draggable,e.map.drag=S,e.methodDict.drag="draggable",r.actions.drag=S.defaults},listeners:{"interactions:before-action-move":E,"interactions:action-resume":E,"interactions:action-move":T,"auto-start:check":function(t){var e=t.interaction,n=t.interactable,r=t.buttons,i=n.options.drag;if(i&&i.enabled&&(!e.pointerIsDown||!/mouse|pointer/.test(e.pointerType)||0!=(r&n.options.drag.mouseButtons)))return t.action={name:"drag",axis:"start"===i.lockAxis?i.startAxis:i.lockAxis},!1}},draggable:function(t){return w.object(t)?(this.options.drag.enabled=!1!==t.enabled,this.setPerAction("drag",t),this.setOnEvents("drag",t),/^(xy|x|y|start)$/.test(t.lockAxis)&&(this.options.drag.lockAxis=t.lockAxis),/^(xy|x|y)$/.test(t.startAxis)&&(this.options.drag.startAxis=t.startAxis),this):w.bool(t)?(this.options.drag.enabled=t,this):this.options.drag},beforeMove:E,move:T,defaults:{startAxis:"xy",lockAxis:"xy"},getCursor:function(){return"move"},filterEventType:function(t){return 0===t.search("drag")}},_=S,P={init:function(t){var e=t;P.document=e.document,P.DocumentFragment=e.DocumentFragment||O,P.SVGElement=e.SVGElement||O,P.SVGSVGElement=e.SVGSVGElement||O,P.SVGElementInstance=e.SVGElementInstance||O,P.Element=e.Element||O,P.HTMLElement=e.HTMLElement||P.Element,P.Event=e.Event,P.Touch=e.Touch||O,P.PointerEvent=e.PointerEvent||e.MSPointerEvent},document:null,DocumentFragment:null,SVGElement:null,SVGSVGElement:null,SVGElementInstance:null,Element:null,HTMLElement:null,Event:null,Touch:null,PointerEvent:null};/**
 * Platzhalterfunktion ohne Nebeneffekte.
 *
 * Verwendet als Standard- oder leere Callback-Implementierung.
 */
function O(){}var k=P;var D={init:function(t){var e=k.Element,n=t.navigator||{};D.supportsTouch="ontouchstart"in t||w.func(t.DocumentTouch)&&k.document instanceof t.DocumentTouch,D.supportsPointerEvent=!1!==n.pointerEnabled&&!!k.PointerEvent,D.isIOS=/iP(hone|od|ad)/.test(n.platform),D.isIOS7=/iP(hone|od|ad)/.test(n.platform)&&/OS 7[^\d]/.test(n.appVersion),D.isIe9=/MSIE 9/.test(n.userAgent),D.isOperaMobile="Opera"===n.appName&&D.supportsTouch&&/Presto/.test(n.userAgent),D.prefixedMatchesSelector="matches"in e.prototype?"matches":"webkitMatchesSelector"in e.prototype?"webkitMatchesSelector":"mozMatchesSelector"in e.prototype?"mozMatchesSelector":"oMatchesSelector"in e.prototype?"oMatchesSelector":"msMatchesSelector",D.pEventTypes=D.supportsPointerEvent?k.PointerEvent===t.MSPointerEvent?{up:"MSPointerUp",down:"MSPointerDown",over:"mouseover",out:"mouseout",move:"MSPointerMove",cancel:"MSPointerCancel"}:{up:"pointerup",down:"pointerdown",over:"pointerover",out:"pointerout",move:"pointermove",cancel:"pointercancel"}:null,D.wheelEvent=k.document&&"onmousewheel"in k.document?"mousewheel":"wheel"},supportsTouch:null,supportsPointerEvent:null,isIOS7:null,isIOS:null,isIe9:null,isOperaMobile:null,prefixedMatchesSelector:null,pEventTypes:null,wheelEvent:null};var I=D;/**
 * Prüft, ob ein DOM-Knoten innerhalb eines anderen liegt (einschließlich Identität).
 * @param {Node} t - Potenzieller Vorfahre- oder Elternknoten.
 * @param {Node} e - Zu prüfender Knoten.
 * @returns {boolean} `true`, wenn `e` gleich `t` ist oder ein Nachfahre von `t` ist, `false` sonst.
 */
function M(t,e){if(t.contains)return t.contains(e);for(;e;){if(e===t)return!0;e=e.parentNode}return!1}/**
 * Sucht ab dem Startknoten das nächstgelegene übergeordnete DOM-Element, das das gegebene Kriterium erfüllt.
 * @param {Node|Element} t - Startknoten, ab dem die Suche beginnt.
 * @param {string|Element|Function} e - Kriterium, z. B. ein CSS-Selektor, ein Element oder eine Prädikat-Funktion, die ein Element prüft.
 * @returns {Element|null} Das erste gefundene Element, das dem Kriterium entspricht, oder `null`, wenn keines gefunden wurde.
 */
function z(t,e){for(;w.element(t);){if(R(t,e))return t;t=A(t)}return null}/**
 * Liefert das nächste übergeordnete Node oder — falls das direkte Elternelement ein DocumentFragment ist — dessen äußersten Host.
 * 
 * @param {Node} t - Das Ausgangs-Node dessen Elternkette untersucht wird.
 * @returns {Node|null} Das gefundene übergeordnete Node oder Host außerhalb verschachtelter DocumentFragments, bzw. `null` wenn keines existiert.
 */
function A(t){var e=t.parentNode;if(w.docFrag(e)){for(;(e=e.host)&&w.docFrag(e););return e}return e}/**
 * Prüft, ob das gegebene Element einem CSS-Selektor entspricht.
 *
 * Vor dem Vergleich werden Vorkommen von "/deep/" durch ein Leerzeichen ersetzt, wenn dies erforderlich ist.
 *
 * @param {Element} t - Das zu prüfende DOM-Element.
 * @param {string} e - Der CSS-Selektor.
 * @returns {boolean} `true`, wenn das Element dem Selektor entspricht, `false` sonst.
 */
function R(t,e){return g!==v&&(e=e.replace(/\/deep\//g," ")),t[I.prefixedMatchesSelector](e)}var C=function(t){return t.parentNode||t.host};/**
 * Gibt die Kette von Elementen zwischen einem Startknoten und seinem Vorfahren (ausschließlich des Vorfahren) zurück.
 * 
 * @param {Element} t - Der Startknoten (nach unten in der Kette).
 * @param {Element} e - Der Vorfahrknoten, bei dessen Erreichen die Sammlung endet (nicht eingeschlossen). Ist e kein Vorfahr, endet die Sammlung am Dokumentenkontext.
 * @returns {Element[]} Ein Array der Elemente in aufsteigender Reihenfolge vom direkt unterhalb des Stopp-Knotens bis zum Startknoten.
 */
function j(t,e){for(var n,r=[],i=t;(n=C(i))&&i!==e&&n!==i.ownerDocument;)r.unshift(i),i=n;return r}/**
 * Prüft, ob ein Element oder einer seiner Vorfahren bis zu einer Abbruchgrenze einem Selektor entspricht.
 * @param {Element} t - Das Start-Element.
 * @param {string|Function} e - Der Selektor oder Prüffunktion, die auf Elemente angewendet wird.
 * @param {Element} n - Die Abbruchgrenze; die Suche endet, sobald dieses Element erreicht wurde (inklusive).
 * @returns {boolean} `true` wenn `t` oder ein Vorfahre bis `n` den Selektor erfüllt, `false` sonst.
 */
function F(t,e,n){for(;w.element(t);){if(R(t,e))return!0;if((t=A(t))===n)return R(t,e)}return!1}/ **
 * Liefert das zugehörige `use`-Element eines Elements, falls vorhanden, sonst das übergebene Element.
 * @param {Element|Object} t - Ein DOM-Element oder ein Objekt, das ggf. die Eigenschaft `correspondingUseElement` enthält.
 * @returns {Element|Object} `t.correspondingUseElement`, falls definiert, sonst `t`.
 */
function X(t){return t.correspondingUseElement||t}/**
 * Liefert die Client‑Rechteck-Koordinaten eines DOM- oder SVG-Elements.
 * @param {Element|SVGElement} t - Das zu messende Element.
 * @returns {{left:number,right:number,top:number,bottom:number,width:number,height:number}|undefined} Ein Objekt mit `left`, `right`, `top`, `bottom`, `width` und `height` in CSS‑Pixeln; `width`/`height` werden aus `e.width`/`e.height` übernommen oder aus `right - left` / `bottom - top` berechnet. Gibt `undefined` zurück, wenn kein Client‑Rect verfügbar ist.
 */
function Y(t){var e=t instanceof k.SVGElement?t.getBoundingClientRect():t.getClientRects()[0];return e&&{left:e.left,right:e.right,top:e.top,bottom:e.bottom,width:e.width||e.right-e.left,height:e.height||e.bottom-e.top}}/**
 * Gibt das Bounding-Client-Rect eines Elements in Seitenkoordinaten zurück.
 * @param {Element} element - Das Element, dessen Rechteck ermittelt werden soll.
 * @returns {{left:number, right:number, top:number, bottom:number}|null} Das Rechteck mit `left`, `right`, `top` und `bottom` in Seitenkoordinaten oder `null`, falls kein Rechteck ermittelt werden kann.
 */
function L(t){var e,n=Y(t);if(!I.isIOS7&&n){var r={x:(e=(e=y(t))||g).scrollX||e.document.documentElement.scrollLeft,y:e.scrollY||e.document.documentElement.scrollTop};n.left+=r.x,n.right+=r.x,n.top+=r.y,n.bottom+=r.y}return n}/**
 * Liefert ein Array mit der Knoten-Hierarchie beginnend bei t bis zum obersten Elternknoten.
 * @param {Node} t - Startknoten.
 * @returns {Node[]} Ein Array der Knoten in aufsteigender Reihenfolge: zuerst t, danach jeweils dessen Eltern.
 */
function q(t){for(var e=[];t;)e.push(t),t=A(t);return e}/**
 * Prüft, ob ein Wert als gültiger CSS-Selektor-String verwendet werden kann.
 * @param {*} t - Der zu prüfende Wert; erwartet ein CSS-Selektor-String.
 * @returns {boolean} `true` wenn `t` ein String ist und `document.querySelector(t)` ohne Fehler aufgerufen werden kann, `false` sonst.
 */
function B(t){return!!w.string(t)&&(k.document.querySelector(t),!0)}/**
 * Kopiert alle aufzählbaren Eigenschaften eines Quellobjekts in ein Zielobjekt.
 * @param {Object} t - Zielobjekt, in das die Eigenschaften kopiert werden.
 * @param {Object} e - Quellobjekt, dessen Eigenschaften kopiert werden.
 * @returns {Object} Das Zielobjekt `t` nach dem Kopieren der Eigenschaften.
 */
function V(t,e){for(var n in e)t[n]=e[n];return t}/**
 * Ermittelt das Begrenzungsrechteck für ein Element anhand des Bezugstyps.
 * @param {string} t - Bezugstyp: `"parent"` für das Elternelement, `"self"` für das Element selbst, sonst ein Typ, der an die Hilfsfunktion `z` weitergegeben wird.
 * @param {Object} e - Objekt mit einer `getRect(element)`-Methode, die das Rechteck des Elements zurückgibt (verwendet bei `"self"`).
 * @param {Element|SVGElement} n - Das Ziel-Element, dessen Rechteck bestimmt werden soll.
 * @returns {Object} Das berechnete Rechteck (`rect`) des Elternelements, des Elements selbst oder das von `z(n, t)` zurückgegebene Rechteck. */
function W(t,e,n){return"parent"===t?A(n):"self"===t?e.getRect(n):z(n,t)}/**
 * Wertet eine Referenz aus, die als String, Funktion oder DOM-Element angegeben sein kann, und liefert das aufgelöste Ergebnis.
 * @param {*} t - Die Referenz: ein Selektor-String, eine Funktion, ein DOM-Element oder ein bereits aufgelöstes Wert.
 * @param {*} e - Kontext/Optionen, die bei der Auswertung von `t` als String herangezogen werden.
 * @param {*} n - Zusätzliche Kontext/Optionen, die bei der Auswertung von `t` als String herangezogen werden.
 * @param {Array} r - Argumente, die an `t` übergeben werden, wenn `t` eine Funktion ist.
 * @returns {*} Das ausgewertete Ergebnis. Ergibt sich ein DOM-Element, wird dessen normalisierte Form zurückgegeben; sonst der unveränderte aufgelöste Wert.
 */
function G(t,e,n,r){var i=t;return w.string(i)?i=W(i,e,n):w.func(i)&&(i=i.apply(void 0,r)),w.element(i)&&(i=L(i)),i}/**
 * Erzeugt aus einem Punkt- oder Rechteck-ähnlichen Objekt ein {x, y}-Koordinatenobjekt.
 * @param {Object|null|undefined} t - Quellobjekt, das entweder die Eigenschaften `x` und `y` oder `left` und `top` enthält.
 * @returns {Object|undefined} Ein Objekt mit den Eigenschaften `x` und `y` (aus `x`/`y` bzw. `left`/`top` entnommen), oder `undefined`, wenn `t` falsy ist.
 */
function N(t){return t&&{x:"x"in t?t.x:t.left,y:"y"in t?t.y:t.top}}/**
 * Normalisiert ein rechteckähnliches Objekt und stellt die Eigenschaften `x`, `y`, `width` und `height` sicher.
 * @param {Object} t - Ein rechteckähnliches Objekt, das entweder bereits `x`/`y`/`width`/`height` besitzt oder stattdessen `left`/`top`/`right`/`bottom` verwendet.
 * @returns {Object} Das gleiche Objekt (oder eine Kopie), erweitert so dass `x` und `y` gesetzt sind (aus `left`/`top` oder 0) und `width`/`height` aus vorhandenen Werten oder aus `right - x` / `bottom - y`.
 */
function U(t){return!t||"x"in t&&"y"in t||((t=V({},t)).x=t.left||0,t.y=t.top||0,t.width=t.width||(t.right||0)-t.x,t.height=t.height||(t.bottom||0)-t.y),t}/**
 * Verschiebt die ausgewählten Kanten eines Rechtecks um einen Delta-Vektor und aktualisiert dessen Breite und Höhe.
 * @param {{left?: boolean, right?: boolean, top?: boolean, bottom?: boolean}} t - Flags, welche Kanten verschoben werden sollen.
 * @param {{left: number, right: number, top: number, bottom: number, width?: number, height?: number}} e - Das Rechteckobjekt, dessen Kanten in-place angepasst und dessen `width`/`height` neu berechnet werden.
 * @param {{x: number, y: number}} n - Der Verschiebungsvektor; `x` wird auf linke/rechte Kante angewendet, `y` auf obere/untere Kante.
 */
function H(t,e,n){t.left&&(e.left+=n.x),t.right&&(e.right+=n.x),t.top&&(e.top+=n.y),t.bottom&&(e.bottom+=n.y),e.width=e.right-e.left,e.height=e.bottom-e.top}/**
 * Bestimmt die Ursprung-Koordinate (Origin) für ein gegebenes Ziel und Element.
 *
 * @param {any} t - Zielobjekt, das eine `options`-Eigenschaft (inkl. `origin`) enthalten kann.
 * @param {any} e - Element oder Kontext, für den die Origin berechnet wird.
 * @param {string} [n] - Optionaler Optionsschlüssel, um eine spezifische Origin-Option in `t.options` auszuwählen.
 * @returns {{x: number, y: number}} Die Origin-Koordinate als Objekt mit `x`- und `y`-Werten; falls keine gültige Origin ermittelt werden kann, `{x:0,y:0}`.
 */
function K(t,e,n){var r=n&&t.options[n];return N(G(r&&r.origin||t.options.origin,t,e,[t&&e]))||{x:0,y:0}}/**
 * Baut eine Listener-Registry auf und registriert einen oder mehrere Listener für die angegebenen Schlüssel.
 *
 * @param {string|Array<string>|Object} t - Schlüssel, Selector-String (mehrere durch Leerzeichen getrennt), Array von Schlüsseln oder ein objekt-Map-Prefix; leere Zeichenfolge bedeutet "ohne Schlüssel" (registriert direkt unter dem Objekt).
 * @param {Function|Array<Function>|Object} e - Listener-Funktion, Array von Listenern oder ein Objekt mit Schlüssel→Listener-Zuordnungen.
 * @param {Function} [n] - Optionaler Prädikat-Callback, der mit einem Schlüssel aufgerufen wird und bei Rückgabe von `true` die Registrierung für diesen Schlüssel erlaubt. Standard: immer `true`.
 * @param {Object} [r] - Optionales Registry-Objekt, in das die Listener eingetragen werden. Falls nicht angegeben, wird ein neues Objekt verwendet.
 * @returns {Object} Das Registry-Objekt mit Schlüssel→Array von Listener-Funktionen. */
function $(t,e){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:function(t){return!0},r=arguments.length>3?arguments[3]:void 0;if(r=r||{},w.string(t)&&-1!==t.search(" ")&&(t=J(t)),w.array(t))return t.forEach((function(t){return $(t,e,n,r)})),r;if(w.object(t)&&(e=t,t=""),w.func(e)&&n(t))r[t]=r[t]||[],r[t].push(e);else if(w.array(e))for(var i=0,o=e;i<o.length;i++){var a=o[i];$(t,a,n,r)}else if(w.object(e))for(var s in e){$(J(s).map((function(e){return"".concat(t).concat(e)})),e[s],n,r)}return r}/**
 * Teilt einen String in einzelne Wörter, getrennt durch ein oder mehrere Leerzeichen.
 * @param {string} t - Der Eingabestring.
 * @returns {string[]} Ein Array der Wörter; bei leerem oder nur aus Leerzeichen bestehendem String ein leeres Array.
 */
function J(t){return t.trim().split(/ +/)}var Q=function(t,e){return Math.sqrt(t*t+e*e)},Z=["webkit","moz"];/**
 * Fügt dem Zielobjekt schreibbare, memoisierten Getter/Setter für die Eigenschaften des Quellobjekts hinzu.
 *
 * Für jede Eigenschaft von `source` wird auf `target` eine Eigenschaft definiert, deren Getter beim ersten Zugriff den Wert
 * aus `source` liest und im internen Cache (`target.__set`) speichert; der Setter aktualisiert diesen Cache.
 * Eigenschaften werden übersprungen, wenn ihr Name in der externen Präfixliste `Z` vorkommt, wenn `target` bereits eine Funktion
 * mit diesem Namen hat oder wenn der Name "__set" ist.
 *
 * @param {Object} target - Das Objekt, dem die Getter/Setter hinzugefügt werden.
 * @param {Object} source - Das Objekt, von dem die ursprünglichen Werte gelesen werden.
 * @returns {Object} Das veränderte `target`-Objekt mit den hinzugefügten Eigenschaften.
 */
function tt(t,e){t.__set||(t.__set={});var n=function(n){if(Z.some((function(t){return 0===n.indexOf(t)})))return 1;"function"!=typeof t[n]&&"__set"!==n&&Object.defineProperty(t,n,{get:function(){return n in t.__set?t.__set[n]:t.__set[n]=e[n]},set:function(e){t.__set[n]=e},configurable:!0})};for(var r in e)n(r);return t}/**
 * Kopiert Koordinaten- und Zeitstempelfelder von einem Quellereignis in ein Zielobjekt.
 *
 * Stellt sicher, dass die Objekte `page` und `client` im Ziel existieren, und setzt `page.x`, `page.y`, `client.x`, `client.y` sowie `timeStamp` aus dem Quellobjekt.
 * @param {Object} t - Zielobjekt, das die Felder erhalten soll.
 * @param {Object} e - Quellobjekt mit den Eigenschaften `page.x`, `page.y`, `client.x`, `client.y` und `timeStamp`.
 */
function et(t,e){t.page=t.page||{},t.page.x=e.page.x,t.page.y=e.page.y,t.client=t.client||{},t.client.x=e.client.x,t.client.y=e.client.y,t.timeStamp=e.timeStamp}/**
 * Setzt die Seiten- und Client-Koordinaten eines Positionsobjekts auf 0.
 * 
 * @param {{page: {x: number, y: number}, client: {x: number, y: number}}} t - Objekt mit den Eigenschaften `page` und `client`, jeweils mit `x`- und `y`-Werten.
 */
function nt(t){t.page.x=0,t.page.y=0,t.client.x=0,t.client.y=0}/**
 * Prüft, ob ein Wert ein DOM-Event- oder Touch-Objekt ist.
 * @param {*} t - Das zu prüfende Objekt.
 * @returns {boolean} `true` wenn `t` ein `Event`- oder `Touch`-Objekt ist, `false` sonst.
 */
function rt(t){return t instanceof k.Event||t instanceof k.Touch}/**
 * Kopiert die X- und Y-Koordinaten aus einem Quellobjekt in ein Zielobjekt.
 * @param {string} [prefix="page"] - Präfix für die Koordinaten-Eigenschaften (z. B. "page" → `pageX`/`pageY`, "client" → `clientX`/`clientY`).
 * @param {Object} source - Objekt mit den Koordinaten-Eigenschaften.
 * @param {Object} [dest] - Zielobjekt, dem die Eigenschaften `x` und `y` hinzugefügt oder überschrieben werden; wird zurückgegeben.
 * @returns {Object} Das Zielobjekt mit den kopierten `x`- und `y`-Werten.
 */
function it(t,e,n){return t=t||"page",(n=n||{}).x=e[t+"X"],n.y=e[t+"Y"],n}/**
 * Ermittelt Seiten- oder Bildschirmkoordinaten eines Zeigerereignisses und schreibt sie in ein Punkt-Objekt.
 * 
 * @param {Event} t - Das Zeigerereignis (z. B. PointerEvent, MouseEvent oder TouchEvent).
 * @param {{x:number,y:number}} [e] - Optionales Zielobjekt, in das die Koordinaten geschrieben werden; falls nicht angegeben, wird ein neues Objekt mit `x` und `y` erstellt.
 * @returns {{x:number,y:number}} Das Punkt-Objekt mit den ermittelten `x`- und `y`-Koordinaten.
 */
function ot(t,e){return e=e||{x:0,y:0},I.isOperaMobile&&rt(t)?(it("screen",t,e),e.x+=window.scrollX,e.y+=window.scrollY):it("page",t,e),e}/**
 * Gibt die eindeutige Zeigerkennung eines Pointer-ähnlichen Objekts zurück.
 * @param {Object} t - Das Pointer- oder Eingabeobjekt; erwartet die Felder `pointerId` und/oder `identifier`.
 * @returns {number|string} `number` wenn `pointerId` eine Zahl ist, sonst der Wert von `identifier`.
 */
function at(t){return w.number(t.pointerId)?t.pointerId:t.identifier}/**
 * Setzt die Seiten- und Client-Koordinaten sowie den Zeitstempel eines Pointer-Objekts.
 *
 * @param {object} t - Das Pointer-Objekt, dessen Koordinaten und Zeitstempel gesetzt werden.
 * @param {Array<object>} e - Array von Pointer-Informationen; bei mehreren Einträgen werden die kombinierten Koordinaten verwendet, sonst das erste Element.
 * @param {number} n - Zeitstempel (in ms), der dem Pointer-Objekt zugewiesen wird.
 */
function st(t,e,n){var r=e.length>1?lt(e):e[0];ot(r,t.page),function(t,e){e=e||{},I.isOperaMobile&&rt(t)?it("screen",t,e):it("client",t,e)}(r,t.client),t.timeStamp=n}/**
 * Liefert die ersten beiden Touch-Punkte aus einem Touch-Event oder aus einem Touch-Array.
 * @param {Event|Array} t - Ein Touch-Event (z. B. mit .touches und .changedTouches) oder ein Array von Touch-Objekten.
 * @returns {Array} Ein Array mit zwei Einträgen [touch0, touch1]; die Einträge stammen aus `touches` oder `changedTouches` je nach Ereignis und können `undefined` sein, wenn weniger als zwei Touches vorhanden sind.
 */
function ct(t){var e=[];return w.array(t)?(e[0]=t[0],e[1]=t[1]):"touchend"===t.type?1===t.touches.length?(e[0]=t.touches[0],e[1]=t.changedTouches[0]):0===t.touches.length&&(e[0]=t.changedTouches[0],e[1]=t.changedTouches[1]):(e[0]=t.touches[0],e[1]=t.touches[1]),e}/**
 * Berechnet den arithmetischen Mittelwert von Koordinaten aus mehreren Pointer-/Event-Objekten.
 *
 * @param {Array<Object>} t - Array von Objekten, die die Eigenschaften `pageX`, `pageY`, `clientX`, `clientY`, `screenX` und `screenY` enthalten.
 * @returns {Object} Ein Objekt mit den mittleren Werten für `pageX`, `pageY`, `clientX`, `clientY`, `screenX` und `screenY`.
 */
function lt(t){for(var e={pageX:0,pageY:0,clientX:0,clientY:0,screenX:0,screenY:0},n=0;n<t.length;n++){var r=t[n];for(var i in e)e[i]+=r[i]}for(var o in e)e[o]/=t.length;return e}/**
 * Berechnet das umschließende Rechteck (Achsen-paralleles Bounding Box) der Pointer in `t`.
 * @param {Array} t - Array oder Array-ähnliche Sammlung von Pointer-Objekten, deren Einträge `pageX` und `pageY` enthalten.
 * @returns {Object} Ein Objekt mit den Eigenschaften:
 *  - `x`, `left`, `top`: minimale `pageX`/`pageY`-Koordinaten,
 *  - `right`, `bottom`: maximale `pageX`/`pageY`-Koordinaten,
 *  - `width`: `right - left`,
 *  - `height`: `bottom - top`.
 */
function ut(t){if(!t.length)return null;var e=ct(t),n=Math.min(e[0].pageX,e[1].pageX),r=Math.min(e[0].pageY,e[1].pageY),i=Math.max(e[0].pageX,e[1].pageX),o=Math.max(e[0].pageY,e[1].pageY);return{x:n,y:r,left:n,top:r,right:i,bottom:o,width:i-n,height:o-r}}/**
 * Berechnet den Q-Wert aus der Differenz der ersten beiden Punkte für eine gegebene Koordinatenart.
 *
 * @param {object} t - Objekt/Interaktion, aus dem die Punktkoordinaten mittels ct(t) gelesen werden.
 * @param {string} e - Präfix der Koordinatenart (z. B. "page" oder "client"); wird zu `eX` und `eY` ergänzt.
 * @returns {*} Der Wert von Q angewendet auf die Differenz (`i[0][eX] - i[1][eX]`, `i[0][eY] - i[1][eY]`).
 */
function pt(t,e){var n=e+"X",r=e+"Y",i=ct(t),o=i[0][n]-i[1][n],a=i[0][r]-i[1][r];return Q(o,a)}/**
 * Berechnet den Winkel in Grad zwischen zwei Punkten relativ zur positiven X-Achse.
 * @param {Object} t - Datenquelle, aus der zwei Punkte abgerufen werden (erwartet von ct verarbeitbares Objekt).
 * @param {string} e - Präfix für die Koordinaten-Eigenschaften (z. B. 'page' ergibt 'pageX'/'pageY').
 * @returns {number} Der Winkel in Grad, gemessen gegen den positiven X-Richtungsvektor (gegen den Uhrzeigersinn).
 */
function ft(t,e){var n=e+"X",r=e+"Y",i=ct(t),o=i[1][n]-i[0][n],a=i[1][r]-i[0][r];return 180*Math.atan2(a,o)/Math.PI}/**
 * Bestimmt den Pointer-Typ aus einem Event- oder Pointer-Objekt.
 *
 * @param {object} t - Das Event- oder Pointer-ähnliche Objekt. Erwartet ggf. die Eigenschaften `pointerType` oder `type` oder eine Instanz von `Touch`.
 * @returns {string|undefined} Der Pointer-Typ: üblicherweise `"touch"`, `"pen"` oder `"mouse"`. Gibt die ursprüngliche `pointerType`-Zeichenkette zurück, eine der genannten Typen, oder `undefined` wenn ein numerischer `pointerType` auf einen nicht definierten Index verweist.
 */
function dt(t){return w.string(t.pointerType)?t.pointerType:w.number(t.pointerType)?[void 0,void 0,"touch","pen","mouse"][t.pointerType]:/touch/.test(t.type||"")||t instanceof k.Touch?"touch":"mouse"}/**
 * Liefert das Ereignisziel und das aktuelle Ziel aus dem Event-Pfad in normalisierter Form.
 * 
 * @param {Event} t - Das DOM-Ereignis.
 * @returns {Array} Ein Array mit zwei Elementen: dem normalisierten Event-Target an Index 0 und dem normalisierten currentTarget an Index 1.
 */
function ht(t){var e=w.func(t.composedPath)?t.composedPath():t.path;return[X(e?e[0]:t.target),X(t.currentTarget)]}var vt=function(){/**
 * Erstellt ein Event-Objekt, das den Propagationsstatus für eine zugeordnete Interaktion speichert.
 * Initialisiert die Propagationsflags `immediatePropagationStopped` und `propagationStopped` mit `false`
 * und verknüpft das Event mit der übergebenen Interaktion.
 * @param {Object} e - Die zugehörige Interaktionsinstanz.  
 */
function t(e){r(this,t),this.immediatePropagationStopped=!1,this.propagationStopped=!1,this._interaction=e}return o(t,[{key:"preventDefault",value:function(){}},{key:"stopPropagation",value:function(){this.propagationStopped=!0}},{key:"stopImmediatePropagation",value:function(){this.immediatePropagationStopped=this.propagationStopped=!0}}]),t}();Object.defineProperty(vt.prototype,"interaction",{get:function(){return this._interaction._proxy},set:function(){}});var gt=function(t,e){for(var n=0;n<e.length;n++){var r=e[n];t.push(r)}return t},mt=function(t){return gt([],t)},yt=function(t,e){for(var n=0;n<t.length;n++)if(e(t[n],n,t))return n;return-1},bt=function(t,e){return t[yt(t,e)]},xt=function(t){s(n,t);var e=p(n);/**
 * Erstellt ein Drop‑bezogenes Interaktionsereignis (z. B. "dragleave" oder "dragenter").
 * @param {Object} t - Objekt mit den Drop‑Zuständen `{ cur, prev }`.
 * @param {Object} i - Das zugehörige Drag-/Interaktionsereignis.
 * @param {string} o - Der Ereignistyp (z. B. "dragleave" oder "dragenter").
 * @returns {Object} Das initialisierte Ereignisobjekt mit Eigenschaften wie `type`, `target`, `currentTarget`, `dropzone`, `dragEvent`, `relatedTarget`, `draggable` und `timeStamp`.
 */
function n(t,i,o){var a;r(this,n),(a=e.call(this,i._interaction)).dropzone=void 0,a.dragEvent=void 0,a.relatedTarget=void 0,a.draggable=void 0,a.propagationStopped=!1,a.immediatePropagationStopped=!1;var s="dragleave"===o?t.prev:t.cur,c=s.element,l=s.dropzone;return a.type=o,a.target=c,a.currentTarget=c,a.dropzone=l,a.dragEvent=i,a.relatedTarget=i.target,a.draggable=i.interactable,a.timeStamp=i.timeStamp,a}return o(n,[{key:"reject",value:function(){var t=this,e=this._interaction.dropState;if("dropactivate"===this.type||this.dropzone&&e.cur.dropzone===this.dropzone&&e.cur.element===this.target)if(e.prev.dropzone=this.dropzone,e.prev.element=this.target,e.rejected=!0,e.events.enter=null,this.stopImmediatePropagation(),"dropactivate"===this.type){var r=e.activeDrops,i=yt(r,(function(e){var n=e.dropzone,r=e.element;return n===t.dropzone&&r===t.target}));e.activeDrops.splice(i,1);var o=new n(e,this.dragEvent,"dropdeactivate");o.dropzone=this.dropzone,o.target=this.target,this.dropzone.fire(o)}else this.dropzone.fire(new n(e,this.dragEvent,"dragleave"))}},{key:"preventDefault",value:function(){}},{key:"stopPropagation",value:function(){this.propagationStopped=!0}},{key:"stopImmediatePropagation",value:function(){this.immediatePropagationStopped=this.propagationStopped=!0}}]),n}(vt);/**
 * Löst ein gegebenes Ereignis nacheinander für jede Dropzone in der übergebenen Liste aus.
 *
 * Für jedes Listenelement werden `event.dropzone` und `event.target` auf die jeweilige Dropzone
 * und ihr zugehöriges Element gesetzt; das Ereignis wird auf der Dropzone ausgelöst. Nach jedem
 * Aufruf werden die Propagationsflags des Ereignisses zurückgesetzt, sodass nachfolgende Dropzones
 * das Ereignis unabhängig behandeln können.
 *
 * @param {Array} list - Array mit Einträgen, die die Eigenschaften `dropzone` (das Dropzone-Objekt) und `element` (das Ziel-Element) enthalten.
 * @param {Object} event - Das Ereignisobjekt, das ausgelöst wird; seine `dropzone`- und `target`-Felder werden verändert.
 */
function wt(t,e){for(var n=0,r=t.slice();n<r.length;n++){var i=r[n],o=i.dropzone,a=i.element;e.dropzone=o,e.target=a,o.fire(e),e.propagationStopped=e.immediatePropagationStopped=!1}}/**
 * Sammelt alle passenden Drop-Ziele (Dropzones) für ein gegebenes Element.
 * @param {Object} t - Die Interact.js-Scope-Instanz, die die registrierten Interactables enthält.
 * @param {Element} e - Das zu prüfende (verschiebbare) Element.
 * @returns {Array<Object>} Eine Liste von Objekten, jeweils mit `dropzone` (Interactable), `element` (Element) und `rect` (Rechteck des Targets).
function Et(t,e){for(var n=function(t,e){for(var n=[],r=0,i=t.interactables.list;r<i.length;r++){var o=i[r];if(o.options.drop.enabled){var a=o.options.drop.accept;if(!(w.element(a)&&a!==e||w.string(a)&&!R(e,a)||w.func(a)&&!a({dropzone:o,draggableElement:e})))for(var s=0,c=o.getAllElements();s<c.length;s++){var l=c[s];l!==e&&n.push({dropzone:o,element:l,rect:o.getRect(l)})}}}return n}(t,e),r=0;r<n.length;r++){var i=n[r];i.rect=i.dropzone.getRect(i.element)}return n}/**
 * Bestimmt das zutreffende Drop-Target aus den aktiven Drop-States für ein gegebenes Interaktionsziel.
 *
 * Führt für jedes aktive Drop-Ziel eine Drop-Prüfung durch, berücksichtigt die resultierenden Treffer,
 * und wählt anhand von DOM-Hierarchie und z-index die passendste aktive Drop-Definition aus.
 *
 * @param {Object} t - Der Interaktionskontext; erwartet `t.dropState.activeDrops`, `t.interactable` und `t.element`.
 * @param {Event|Object} e - Das ausgelöste Pointer-/Interaktionsereignis oder dessen normalisierte Form.
 * @param {Object} n - Zusätzliche Event-/Koordinateninformationen, die an die Drop-Prüfung weitergereicht werden.
 * @returns {Object|null} Das ausgewählte Objekt aus `t.dropState.activeDrops`, oder `null` wenn keines passt.
 */
function Tt(t,e,n){for(var r=t.dropState,i=t.interactable,o=t.element,a=[],s=0,c=r.activeDrops;s<c.length;s++){var l=c[s],u=l.dropzone,p=l.element,f=l.rect,d=u.dropCheck(e,n,i,o,p,f);a.push(d?p:null)}var h=function(t){for(var e,n,r,i=[],o=0;o<t.length;o++){var a=t[o],s=t[e];if(a&&o!==e)if(s){var c=C(a),l=C(s);if(c!==a.ownerDocument)if(l!==a.ownerDocument)if(c!==l){i=i.length?i:j(s);var u=void 0;if(s instanceof k.HTMLElement&&a instanceof k.SVGElement&&!(a instanceof k.SVGSVGElement)){if(a===l)continue;u=a.ownerSVGElement}else u=a;for(var p=j(u,s.ownerDocument),f=0;p[f]&&p[f]===i[f];)f++;var d=[p[f-1],p[f],i[f]];if(d[0])for(var h=d[0].lastChild;h;){if(h===d[1]){e=o,i=p;break}if(h===d[2])break;h=h.previousSibling}}else r=s,void 0,void 0,(parseInt(y(n=a).getComputedStyle(n).zIndex,10)||0)>=(parseInt(y(r).getComputedStyle(r).zIndex,10)||0)&&(e=o);else e=o}else e=o}return e}(a);return r.activeDrops[h]||null}/**
 * Erzeugt passende Drop-bezogene InteractEvent-Instanzen für ein gegebenes Drag-Ereignis basierend auf dem aktuellen Drop-State.
 *
 * Erstellt ein Objekt mit den möglichen Drop-Ereignissen (`enter`, `leave`, `activate`, `deactivate`, `move`, `drop`). Bei Bedarf werden neue InteractEvent-Objekte erzeugt und relevante Felder am ursprünglichen Ereignis (`n`) gesetzt (z. B. `dragEnter`, `dragLeave`, `dropzone`, `relatedTarget`).
 *
 * @param {Object} t - Das Interaction-Objekt, das ein `dropState`-Feld enthält.
 * @param {*} e - Unbenutzter Platzhalterparameter (wird im Aufruf übergeben, aber nicht ausgewertet).
 * @param {InteractEvent} n - Das auslösende Drag-Ereignis; sein `type` bestimmt, welche Drop-Ereignisse erzeugt werden.
 * @returns {Object} Ein Objekt mit den Schlüsseln `enter`, `leave`, `activate`, `deactivate`, `move`, `drop`; jeder Wert ist entweder eine erzeugte InteractEvent-Instanz oder `null`.
 */
function St(t,e,n){var r=t.dropState,i={enter:null,leave:null,activate:null,deactivate:null,move:null,drop:null};return"dragstart"===n.type&&(i.activate=new xt(r,n,"dropactivate"),i.activate.target=null,i.activate.dropzone=null),"dragend"===n.type&&(i.deactivate=new xt(r,n,"dropdeactivate"),i.deactivate.target=null,i.deactivate.dropzone=null),r.rejected||(r.cur.element!==r.prev.element&&(r.prev.dropzone&&(i.leave=new xt(r,n,"dragleave"),n.dragLeave=i.leave.target=r.prev.element,n.prevDropzone=i.leave.dropzone=r.prev.dropzone),r.cur.dropzone&&(i.enter=new xt(r,n,"dragenter"),n.dragEnter=r.cur.element,n.dropzone=r.cur.dropzone)),"dragend"===n.type&&r.cur.dropzone&&(i.drop=new xt(r,n,"drop"),n.dropzone=r.cur.dropzone,n.relatedTarget=r.cur.element),"dragmove"===n.type&&r.cur.dropzone&&(i.move=new xt(r,n,"dropmove"),n.dropzone=r.cur.dropzone)),i}/**
 * Sendet Drop-bezogene Events an die aktuelle bzw. vorherige Dropzone und aktualisiert den gespeicherten Drop-Zustand.
 *
 * Wenn vorhanden, wird das `leave`-Event an die vorherige Dropzone gefeuert; `enter`, `move` und `drop` werden an die aktuelle Dropzone gefeuert.
 * Führt außerdem bei Bedarf ein `deactivate`-Event für alle aktiven Drops aus und setzt `dropState.prev` auf die aktuelle Dropzone/Element-Kombination.
 *
 * @param {Object} t - Objekt mit dem Drop-Zustand. Erwartet ein `dropState`-Objekt mit den Feldern `activeDrops`, `cur` und `prev`.
 * @param {Object} e - Flags oder Event-Objekte mit optionalen Feldern `leave`, `enter`, `move`, `drop` und `deactivate` (jeweils ein Event-Descriptor oder Truthy-Wert).
 */
function _t(t,e){var n=t.dropState,r=n.activeDrops,i=n.cur,o=n.prev;e.leave&&o.dropzone.fire(e.leave),e.enter&&i.dropzone.fire(e.enter),e.move&&i.dropzone.fire(e.move),e.drop&&i.dropzone.fire(e.drop),e.deactivate&&wt(r,e.deactivate),n.prev.dropzone=i.dropzone,n.prev.element=i.element}/**
 * Aktualisiert den Drop-Zustand während Drag-Bewegungs- oder Drag-End-Ereignissen.
 *
 * Aktualisiert bei passenden Drag-Ereignissen den Drop-Status der übergebenen Interaction:
 * wenn `dynamicDrop` gesetzt ist, werden aktive Drop-Ziele neu ermittelt; das aktuell
 * erkannte Dropzone/Element, das Ablehnen-Flag und die zugehörigen Drop-Events werden gesetzt.
 *
 * @param {Object} t - Kontextobjekt mit Informationen zur aktuellen Interaktion und Ereignissen.
 * @param {Object} t.interaction - Die laufende Interaction-Instanz.
 * @param {Object} t.iEvent - Das normalisierte Interact-Event (z. B. "dragmove" / "dragend").
 * @param {Event} t.event - Das originale DOM-/Pointer-Ereignis.
 * @param {Object} e - Drop-bezogene Optionen/Status.
 * @param {boolean} e.dynamicDrop - Wenn `true`, werden aktive Drop-Ziele dynamisch neu ermittelt.
 */
function Pt(t,e){var n=t.interaction,r=t.iEvent,i=t.event;if("dragmove"===r.type||"dragend"===r.type){var o=n.dropState;e.dynamicDrop&&(o.activeDrops=Et(e,n.element));var a=r,s=Tt(n,a,i);o.rejected=o.rejected&&!!s&&s.dropzone===o.cur.dropzone&&s.element===o.cur.element,o.cur.dropzone=s&&s.dropzone,o.cur.element=s&&s.element,o.events=St(n,0,a)}}var Ot={id:"actions/drop",install:function(t){var e=t.actions,n=t.interactStatic,r=t.Interactable,i=t.defaults;t.usePlugin(_),r.prototype.dropzone=function(t){return function(t,e){if(w.object(e)){if(t.options.drop.enabled=!1!==e.enabled,e.listeners){var n=$(e.listeners),r=Object.keys(n).reduce((function(t,e){return t[/^(enter|leave)/.test(e)?"drag".concat(e):/^(activate|deactivate|move)/.test(e)?"drop".concat(e):e]=n[e],t}),{}),i=t.options.drop.listeners;i&&t.off(i),t.on(r),t.options.drop.listeners=r}return w.func(e.ondrop)&&t.on("drop",e.ondrop),w.func(e.ondropactivate)&&t.on("dropactivate",e.ondropactivate),w.func(e.ondropdeactivate)&&t.on("dropdeactivate",e.ondropdeactivate),w.func(e.ondragenter)&&t.on("dragenter",e.ondragenter),w.func(e.ondragleave)&&t.on("dragleave",e.ondragleave),w.func(e.ondropmove)&&t.on("dropmove",e.ondropmove),/^(pointer|center)$/.test(e.overlap)?t.options.drop.overlap=e.overlap:w.number(e.overlap)&&(t.options.drop.overlap=Math.max(Math.min(1,e.overlap),0)),"accept"in e&&(t.options.drop.accept=e.accept),"checker"in e&&(t.options.drop.checker=e.checker),t}if(w.bool(e))return t.options.drop.enabled=e,t;return t.options.drop}(this,t)},r.prototype.dropCheck=function(t,e,n,r,i,o){return function(t,e,n,r,i,o,a){var s=!1;if(!(a=a||t.getRect(o)))return!!t.options.drop.checker&&t.options.drop.checker(e,n,s,t,o,r,i);var c=t.options.drop.overlap;if("pointer"===c){var l=K(r,i,"drag"),u=ot(e);u.x+=l.x,u.y+=l.y;var p=u.x>a.left&&u.x<a.right,f=u.y>a.top&&u.y<a.bottom;s=p&&f}var d=r.getRect(i);if(d&&"center"===c){var h=d.left+d.width/2,v=d.top+d.height/2;s=h>=a.left&&h<=a.right&&v>=a.top&&v<=a.bottom}if(d&&w.number(c)){s=Math.max(0,Math.min(a.right,d.right)-Math.max(a.left,d.left))*Math.max(0,Math.min(a.bottom,d.bottom)-Math.max(a.top,d.top))/(d.width*d.height)>=c}t.options.drop.checker&&(s=t.options.drop.checker(e,n,s,t,o,r,i));return s}(this,t,e,n,r,i,o)},n.dynamicDrop=function(e){return w.bool(e)?(t.dynamicDrop=e,n):t.dynamicDrop},V(e.phaselessTypes,{dragenter:!0,dragleave:!0,dropactivate:!0,dropdeactivate:!0,dropmove:!0,drop:!0}),e.methodDict.drop="dropzone",t.dynamicDrop=!1,i.actions.drop=Ot.defaults},listeners:{"interactions:before-action-start":function(t){var e=t.interaction;"drag"===e.prepared.name&&(e.dropState={cur:{dropzone:null,element:null},prev:{dropzone:null,element:null},rejected:null,events:null,activeDrops:[]})},"interactions:after-action-start":function(t,e){var n=t.interaction,r=(t.event,t.iEvent);if("drag"===n.prepared.name){var i=n.dropState;i.activeDrops=[],i.events={},i.activeDrops=Et(e,n.element),i.events=St(n,0,r),i.events.activate&&(wt(i.activeDrops,i.events.activate),e.fire("actions/drop:start",{interaction:n,dragEvent:r}))}},"interactions:action-move":Pt,"interactions:after-action-move":function(t,e){var n=t.interaction,r=t.iEvent;if("drag"===n.prepared.name){var i=n.dropState;_t(n,i.events),e.fire("actions/drop:move",{interaction:n,dragEvent:r}),i.events={}}},"interactions:action-end":function(t,e){if("drag"===t.interaction.prepared.name){var n=t.interaction,r=t.iEvent;Pt(t,e),_t(n,n.dropState.events),e.fire("actions/drop:end",{interaction:n,dragEvent:r})}},"interactions:stop":function(t){var e=t.interaction;if("drag"===e.prepared.name){var n=e.dropState;n&&(n.activeDrops=null,n.events=null,n.cur.dropzone=null,n.cur.element=null,n.prev.dropzone=null,n.prev.element=null,n.rejected=!1)}}},getActiveDrops:Et,getDrop:Tt,getDropEvents:St,fireDropEvents:_t,filterEventType:function(t){return 0===t.search("drag")||0===t.search("drop")},defaults:{enabled:!1,accept:null,overlap:"pointer"}},kt=Ot;/**
 * Aktualisiert die Gestenmetrik-Werte für ein Interaktionsereignis und synchronisiert den Gestenzustand der Interaction (Entfernung, Box, Skalierung, Delta-Skalierung, Winkel, Delta-Winkel) entsprechend der übergebenen Phase.
 *
 * @param {Object} t - Kontextobjekt mit den benötigten Daten.
 * @param {Object} t.interaction - Die aktuelle Interaction-Instanz, deren `pointers`, `interactable`-Optionen und `gesture`-Zustand verwendet und aktualisiert werden.
 * @param {Object} t.iEvent - Das zu aktualisierende InteractEvent-Objekt; Felder wie `touches`, `distance`, `box`, `scale`, `ds`, `angle` und `da` werden gesetzt.
 * @param {string} t.phase - Die Phase der Interaktion (`"start"`, `"move"` oder `"end"`), die das Update-Verhalten bestimmt.
 */
function Dt(t){var e=t.interaction,n=t.iEvent,r=t.phase;if("gesture"===e.prepared.name){var i=e.pointers.map((function(t){return t.pointer})),o="start"===r,a="end"===r,s=e.interactable.options.deltaSource;if(n.touches=[i[0],i[1]],o)n.distance=pt(i,s),n.box=ut(i),n.scale=1,n.ds=0,n.angle=ft(i,s),n.da=0,e.gesture.startDistance=n.distance,e.gesture.startAngle=n.angle;else if(a||e.pointers.length<2){var c=e.prevEvent;n.distance=c.distance,n.box=c.box,n.scale=c.scale,n.ds=0,n.angle=c.angle,n.da=0}else n.distance=pt(i,s),n.box=ut(i),n.scale=n.distance/e.gesture.startDistance,n.angle=ft(i,s),n.ds=n.scale-e.gesture.scale,n.da=n.angle-e.gesture.angle;e.gesture.distance=n.distance,e.gesture.angle=n.angle,w.number(n.scale)&&n.scale!==1/0&&!isNaN(n.scale)&&(e.gesture.scale=n.scale)}}var It={id:"actions/gesture",before:["actions/drag","actions/resize"],install:function(t){var e=t.actions,n=t.Interactable,r=t.defaults;n.prototype.gesturable=function(t){return w.object(t)?(this.options.gesture.enabled=!1!==t.enabled,this.setPerAction("gesture",t),this.setOnEvents("gesture",t),this):w.bool(t)?(this.options.gesture.enabled=t,this):this.options.gesture},e.map.gesture=It,e.methodDict.gesture="gesturable",r.actions.gesture=It.defaults},listeners:{"interactions:action-start":Dt,"interactions:action-move":Dt,"interactions:action-end":Dt,"interactions:new":function(t){t.interaction.gesture={angle:0,distance:0,scale:1,startAngle:0,startDistance:0}},"auto-start:check":function(t){if(!(t.interaction.pointers.length<2)){var e=t.interactable.options.gesture;if(e&&e.enabled)return t.action={name:"gesture"},!1}}},defaults:{},getCursor:function(){return""},filterEventType:function(t){return 0===t.search("gesture")}},Mt=It;/**
 * Prüft, ob ein gegebenes Ziel/Element oder ein Punkt in Bezug auf eine angegebene Kante als Treffer gilt.
 *
 * Wenn `e === true`, wird anhand des übergebenen Rechtecks `o` und der Kante `t` ermittelt, ob der Punkt `n`
 * innerhalb des Schwellwerts `a` zur Kante liegt. Andernfalls wird geprüft, ob `r` mit `e` übereinstimmt oder ob `r`
 * dem Selektor/Match-Kriterium `e` entspricht (unter Verwendung von `i` als optionalem Kontext).
 *
 * @param {string} t - Kante: `"left"`, `"top"`, `"right"` oder `"bottom"`.
 * @param {*} e - Trefferziel: `true` (Verwende Rechteck `o`), ein Element, ein Selektor oder `null`/`undefined`.
 * @param {{x:number,y:number}} n - Punktkoordinaten zur Abstandsbewertung.
 * @param {Element} r - Das zu prüfende DOM-Element.
 * @param {*} i - Optionaler Kontext/Selektor-Kontext für die Übereinstimmungsprüfung.
 * @param {{left:number,right:number,top:number,bottom:number,width?:number,height?:number}} o - Rechteck/Bounds, die für die Kantenprüfung verwendet werden.
 * @param {number} a - Maximaler Abstand (Schwellenwert) zur Kante.
 * @returns {boolean} `true`, wenn das Ziel/Punkt als Treffer zur angegebenen Kante gilt, `false` sonst.
 */
function zt(t,e,n,r,i,o,a){if(!e)return!1;if(!0===e){var s=w.number(o.width)?o.width:o.right-o.left,c=w.number(o.height)?o.height:o.bottom-o.top;if(a=Math.min(a,Math.abs(("left"===t||"right"===t?s:c)/2)),s<0&&("left"===t?t="right":"right"===t&&(t="left")),c<0&&("top"===t?t="bottom":"bottom"===t&&(t="top")),"left"===t){var l=s>=0?o.left:o.right;return n.x<l+a}if("top"===t){var u=c>=0?o.top:o.bottom;return n.y<u+a}if("right"===t)return n.x>(s>=0?o.right:o.left)-a;if("bottom"===t)return n.y>(c>=0?o.bottom:o.top)-a}return!!w.element(r)&&(w.element(e)?e===r:F(r,e,i))}/**
 * Passt die iEvent-Delta- und Achsenwerte entsprechend den Resize-Optionen der aktuellen Interaction an.
 *
 * Wenn die vorbereitete Aktion eine Resize ist und resizeAxes gesetzt ist, werden die Delta-Komponenten
 * und das Achsenfeld des übergebenen iEvent so modifiziert, dass sie entweder quadratisch (gleiches
 * Delta in x und y) oder auf die gewählte Achse beschränkt sind.
 *
 * @param {Object} t - Kontextobjekt.
 * @param {Object} t.iEvent - Das zu aktualisierende Interact-Event-Objekt; erwartet ein `delta`-Objekt und ein `axes`-Feld.
 * @param {Object} t.interaction - Die aktuelle Interaction; erwartet `prepared.name`, `resizeAxes` und `interactable.options.resize.square`.
 */
function At(t){var e=t.iEvent,n=t.interaction;if("resize"===n.prepared.name&&n.resizeAxes){var r=e;n.interactable.options.resize.square?("y"===n.resizeAxes?r.delta.x=r.delta.y:r.delta.y=r.delta.x,r.axes="xy"):(r.axes=n.resizeAxes,"x"===n.resizeAxes?r.delta.y=0:"y"===n.resizeAxes&&(r.delta.x=0))}}var Rt,Ct,jt={id:"actions/resize",before:["actions/drag"],install:function(t){var e=t.actions,n=t.browser,r=t.Interactable,i=t.defaults;jt.cursors=function(t){return t.isIe9?{x:"e-resize",y:"s-resize",xy:"se-resize",top:"n-resize",left:"w-resize",bottom:"s-resize",right:"e-resize",topleft:"se-resize",bottomright:"se-resize",topright:"ne-resize",bottomleft:"ne-resize"}:{x:"ew-resize",y:"ns-resize",xy:"nwse-resize",top:"ns-resize",left:"ew-resize",bottom:"ns-resize",right:"ew-resize",topleft:"nwse-resize",bottomright:"nwse-resize",topright:"nesw-resize",bottomleft:"nesw-resize"}}(n),jt.defaultMargin=n.supportsTouch||n.supportsPointerEvent?20:10,r.prototype.resizable=function(e){return function(t,e,n){if(w.object(e))return t.options.resize.enabled=!1!==e.enabled,t.setPerAction("resize",e),t.setOnEvents("resize",e),w.string(e.axis)&&/^x$|^y$|^xy$/.test(e.axis)?t.options.resize.axis=e.axis:null===e.axis&&(t.options.resize.axis=n.defaults.actions.resize.axis),w.bool(e.preserveAspectRatio)?t.options.resize.preserveAspectRatio=e.preserveAspectRatio:w.bool(e.square)&&(t.options.resize.square=e.square),t;if(w.bool(e))return t.options.resize.enabled=e,t;return t.options.resize}(this,e,t)},e.map.resize=jt,e.methodDict.resize="resizable",i.actions.resize=jt.defaults},listeners:{"interactions:new":function(t){t.interaction.resizeAxes="xy"},"interactions:action-start":function(t){!function(t){var e=t.iEvent,n=t.interaction;if("resize"===n.prepared.name&&n.prepared.edges){var r=e,i=n.rect;n._rects={start:V({},i),corrected:V({},i),previous:V({},i),delta:{left:0,right:0,width:0,top:0,bottom:0,height:0}},r.edges=n.prepared.edges,r.rect=n._rects.corrected,r.deltaRect=n._rects.delta}}(t),At(t)},"interactions:action-move":function(t){!function(t){var e=t.iEvent,n=t.interaction;if("resize"===n.prepared.name&&n.prepared.edges){var r=e,i=n.interactable.options.resize.invert,o="reposition"===i||"negate"===i,a=n.rect,s=n._rects,c=s.start,l=s.corrected,u=s.delta,p=s.previous;if(V(p,l),o){if(V(l,a),"reposition"===i){if(l.top>l.bottom){var f=l.top;l.top=l.bottom,l.bottom=f}if(l.left>l.right){var d=l.left;l.left=l.right,l.right=d}}}else l.top=Math.min(a.top,c.bottom),l.bottom=Math.max(a.bottom,c.top),l.left=Math.min(a.left,c.right),l.right=Math.max(a.right,c.left);for(var h in l.width=l.right-l.left,l.height=l.bottom-l.top,l)u[h]=l[h]-p[h];r.edges=n.prepared.edges,r.rect=l,r.deltaRect=u}}(t),At(t)},"interactions:action-end":function(t){var e=t.iEvent,n=t.interaction;if("resize"===n.prepared.name&&n.prepared.edges){var r=e;r.edges=n.prepared.edges,r.rect=n._rects.corrected,r.deltaRect=n._rects.delta}},"auto-start:check":function(t){var e=t.interaction,n=t.interactable,r=t.element,i=t.rect,o=t.buttons;if(i){var a=V({},e.coords.cur.page),s=n.options.resize;if(s&&s.enabled&&(!e.pointerIsDown||!/mouse|pointer/.test(e.pointerType)||0!=(o&s.mouseButtons))){if(w.object(s.edges)){var c={left:!1,right:!1,top:!1,bottom:!1};for(var l in c)c[l]=zt(l,s.edges[l],a,e._latestPointer.eventTarget,r,i,s.margin||jt.defaultMargin);c.left=c.left&&!c.right,c.top=c.top&&!c.bottom,(c.left||c.right||c.top||c.bottom)&&(t.action={name:"resize",edges:c})}else{var u="y"!==s.axis&&a.x>i.right-jt.defaultMargin,p="x"!==s.axis&&a.y>i.bottom-jt.defaultMargin;(u||p)&&(t.action={name:"resize",axes:(u?"x":"")+(p?"y":"")})}return!t.action&&void 0}}}},defaults:{square:!1,preserveAspectRatio:!1,axis:"xy",margin:NaN,edges:null,invert:"none"},cursors:null,getCursor:function(t){var e=t.edges,n=t.axis,r=t.name,i=jt.cursors,o=null;if(n)o=i[r+n];else if(e){for(var a="",s=0,c=["top","bottom","left","right"];s<c.length;s++){var l=c[s];e[l]&&(a+=l)}o=i[a]}return o},filterEventType:function(t){return 0===t.search("resize")},defaultMargin:null},Ft=jt,Xt={id:"actions",install:function(t){t.usePlugin(Mt),t.usePlugin(Ft),t.usePlugin(_),t.usePlugin(kt)}},Yt=0;var Lt={request:function(t){return Rt(t)},cancel:function(t){return Ct(t)},init:function(t){if(Rt=t.requestAnimationFrame,Ct=t.cancelAnimationFrame,!Rt)for(var e=["ms","moz","webkit","o"],n=0;n<e.length;n++){var r=e[n];Rt=t["".concat(r,"RequestAnimationFrame")],Ct=t["".concat(r,"CancelAnimationFrame")]||t["".concat(r,"CancelRequestAnimationFrame")]}Rt=Rt&&Rt.bind(t),Ct=Ct&&Ct.bind(t),Rt||(Rt=function(e){var n=Date.now(),r=Math.max(0,16-(n-Yt)),i=t.setTimeout((function(){e(n+r)}),r);return Yt=n+r,i},Ct=function(t){return clearTimeout(t)})}};var qt={defaults:{enabled:!1,margin:60,container:null,speed:300},now:Date.now,interaction:null,i:0,x:0,y:0,isScrolling:!1,prevTime:0,margin:0,speed:0,start:function(t){qt.isScrolling=!0,Lt.cancel(qt.i),t.autoScroll=qt,qt.interaction=t,qt.prevTime=qt.now(),qt.i=Lt.request(qt.scroll)},stop:function(){qt.isScrolling=!1,qt.interaction&&(qt.interaction.autoScroll=null),Lt.cancel(qt.i)},scroll:function(){var t=qt.interaction,e=t.interactable,n=t.element,r=t.prepared.name,i=e.options[r].autoScroll,o=Bt(i.container,e,n),a=qt.now(),s=(a-qt.prevTime)/1e3,c=i.speed*s;if(c>=1){var l={x:qt.x*c,y:qt.y*c};if(l.x||l.y){var u=Vt(o);w.window(o)?o.scrollBy(l.x,l.y):o&&(o.scrollLeft+=l.x,o.scrollTop+=l.y);var p=Vt(o),f={x:p.x-u.x,y:p.y-u.y};(f.x||f.y)&&e.fire({type:"autoscroll",target:n,interactable:e,delta:f,interaction:t,container:o})}qt.prevTime=a}qt.isScrolling&&(Lt.cancel(qt.i),qt.i=Lt.request(qt.scroll))},check:function(t,e){var n;return null==(n=t.options[e].autoScroll)?void 0:n.enabled},onInteractionMove:function(t){var e=t.interaction,n=t.pointer;if(e.interacting()&&qt.check(e.interactable,e.prepared.name))if(e.simulation)qt.x=qt.y=0;else{var r,i,o,a,s=e.interactable,c=e.element,l=e.prepared.name,u=s.options[l].autoScroll,p=Bt(u.container,s,c);if(w.window(p))a=n.clientX<qt.margin,r=n.clientY<qt.margin,i=n.clientX>p.innerWidth-qt.margin,o=n.clientY>p.innerHeight-qt.margin;else{var f=Y(p);a=n.clientX<f.left+qt.margin,r=n.clientY<f.top+qt.margin,i=n.clientX>f.right-qt.margin,o=n.clientY>f.bottom-qt.margin}qt.x=i?1:a?-1:0,qt.y=o?1:r?-1:0,qt.isScrolling||(qt.margin=u.margin,qt.speed=u.speed,qt.start(e))}}};/**
 * Liefert die durch `t` bezeichnete Referenz oder — falls keine gültige Referenz gefunden wird — einen Fallback basierend auf `n`.
 *
 * Wenn `t` eine Zeichenkette ist, wird sie im Kontext von `e` und `n` aufgelöst; ist `t` bereits eine Referenz, wird sie direkt zurückgegeben. Wenn diese Auflösung keine verwertbare Referenz ergibt, wird ein Ersatzwert aus `n` zurückgegeben.
 *
 * @param {*} t - Eine Referenz oder eine Zeichenkette, die auf eine Referenz zeigt.
 * @param {*} e - Kontext, in dem eine Zeichenkettenreferenz aufgelöst werden soll (z. B. ein Element oder Dokument).
 * @param {*} n - Zusätzliche Kontextinformation, die zur Auflösung oder als Fallback verwendet wird.
 * @returns {*} Die aufgelöste Referenz, oder ein Fallbackwert, falls keine gültige Referenz ermittelt werden konnte.
 */
function Bt(t,e,n){return(w.string(t)?W(t,e,n):t)||y(n)}/**
 * Liefert die aktuellen Scroll-Positionen für ein Element oder das Dokument.
 * @param {Element|Window} t - Das Ziel, dessen Scroll-Position abgefragt werden soll. Wird das Window übergeben, wird die Dokument-Body-Position verwendet.
 * @returns {{x: number, y: number}} `x` — horizontale Scroll-Position in Pixeln, `y` — vertikale Scroll-Position in Pixeln.
 */
function Vt(t){return w.window(t)&&(t=window.document.body),{x:t.scrollLeft,y:t.scrollTop}}var Wt={id:"auto-scroll",install:function(t){var e=t.defaults,n=t.actions;t.autoScroll=qt,qt.now=function(){return t.now()},n.phaselessTypes.autoscroll=!0,e.perAction.autoScroll=qt.defaults},listeners:{"interactions:new":function(t){t.interaction.autoScroll=null},"interactions:destroy":function(t){t.interaction.autoScroll=null,qt.stop(),qt.interaction&&(qt.interaction=null)},"interactions:stop":qt.stop,"interactions:action-move":function(t){return qt.onInteractionMove(t)}}},Gt=Wt;/**
 * Erzeugt eine Wrapper-Funktion, die beim ersten Aufruf eine Warnmeldung protokolliert und anschließend die übergebene Funktion ausführt.
 * @param {Function} t - Die ursprüngliche Funktion, die aufgerufen werden soll.
 * @param {string} e - Die Warnmeldung, die beim ersten Aufruf mit `console.warn` ausgegeben wird.
 * @returns {Function} Die Wrapper-Funktion, die beim ersten Aufruf `console.warn(e)` ausgibt und dann `t` mit den übergebenen Argumenten aufruft. 
 */
function Nt(t,e){var n=!1;return function(){return n||(g.console.warn(e),n=!0),t.apply(this,arguments)}}/**
 * Kopiert die Eigenschaften `name`, `axis` und `edges` von `e` nach `t` und gibt das aktualisierte Zielobjekt zurück.
 * @param {Object} t - Zielobjekt, das die Eigenschaften erhalten soll.
 * @param {Object} e - Quellobjekt mit den Eigenschaften `name`, `axis` und `edges`.
 * @returns {Object} Das aktualisierte Zielobjekt `t`.
 */
function Ut(t,e){return t.name=e.name,t.axis=e.axis,t.edges=e.edges,t}/**
 * Gibt die Option `styleCursor` zurück oder setzt bzw. entfernt sie.
 * @param {boolean|null} [t] - `true` oder `false`, um `styleCursor` zu setzen; `null`, um die Option zu entfernen; weggelassen für einen Lesezugriff.
 * @returns {this|boolean|undefined} Bei Setzen oder Entfernen wird die Interactable-Instanz (`this`) zurückgegeben; bei Lesezugriff der aktuelle Wert von `options.styleCursor` (`boolean` oder `undefined`).
 */
function Ht(t){return w.bool(t)?(this.options.styleCursor=t,this):null===t?(delete this.options.styleCursor,this):this.options.styleCursor}/**
 * Setzt, entfernt oder gibt die `actionChecker`-Funktion in den Optionen der Instanz zurück.
 * @param {Function|null|undefined} t - Eine Funktion, um `actionChecker` zu setzen; `null`, um `actionChecker` zu entfernen; oder fehlend/anderer Wert, um den aktuellen `actionChecker` abzurufen.
 * @returns {Object|Function|undefined} Die Instanz (`this`), wenn `t` eine Funktion oder `null` ist; ansonsten die aktuell konfigurierte `actionChecker`-Funktion oder `undefined`, falls keine gesetzt ist.
 */
function Kt(t){return w.func(t)?(this.options.actionChecker=t,this):null===t?(delete this.options.actionChecker,this):this.options.actionChecker}var $t={id:"auto-start/interactableMethods",install:function(t){var e=t.Interactable;e.prototype.getAction=function(e,n,r,i){var o=function(t,e,n,r,i){var o=t.getRect(r),a=e.buttons||{0:1,1:4,3:8,4:16}[e.button],s={action:null,interactable:t,interaction:n,element:r,rect:o,buttons:a};return i.fire("auto-start:check",s),s.action}(this,n,r,i,t);return this.options.actionChecker?this.options.actionChecker(e,n,o,this,i,r):o},e.prototype.ignoreFrom=Nt((function(t){return this._backCompatOption("ignoreFrom",t)}),"Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue})."),e.prototype.allowFrom=Nt((function(t){return this._backCompatOption("allowFrom",t)}),"Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue})."),e.prototype.actionChecker=Kt,e.prototype.styleCursor=Ht}};/**
 * Prüft, ob die gegebene Aktion für das Interactable, Ziel und Ereignis zulässig und aktiviert ist, und gibt die Aktion zurück falls ja.
 * 
 * @param {Object} t - Die Aktionsdefinition (muss ein `name`-Feld enthalten).
 * @param {Object} e - Das Interactable-Objekt, das Optionen und Prüfmethoden enthält.
 * @param {Element} n - Das Ziel-Element der Aktion.
 * @param {Event} r - Das auslösende Ereignis.
 * @param {Object} i - Die aktuelle Interaction-Instanz oder Kontextobjekt.
 * @returns {Object|null} Die Aktionsdefinition `t`, wenn sie erlaubt und aktiviert ist, sonst `null`.
 */
function Jt(t,e,n,r,i){return e.testIgnoreAllow(e.options[t.name],n,r)&&e.options[t.name].enabled&&ee(e,n,t,i)?t:null}/**
 * Sucht in einer Menge von Interactables das erste Element, das eine gültige Aktion für die gegebenen Parameter liefert.
 *
 * @param {?} t - Das Pointer-/Ereignisobjekt oder Kontext, anhand dessen die Aktion ermittelt wird.
 * @param {string} e - Der Name der gesuchten Aktion (z. B. "drag", "resize").
 * @param {?} n - Zusatzinformation oder Interaktionskontext, der an `getAction` übergeben wird.
 * @param {Array} r - Array von Interactable-Objekten, die nacheinander auf eine passende Aktion geprüft werden.
 * @param {Array} i - Parallel-Array mit DOM-Elementen, wobei i[s] zum Interactable r[s] gehört.
 * @param {?} o - Das native oder normalisierte Event, das zur Validierung der Aktion verwendet wird.
 * @param {?} a - Zusätzlicher Kontext/Optionen, die an die Aktionsprüfung weitergereicht werden.
 * @returns {{action: ?, interactable: ?, element: ?}} Das erste gefundene Trio `{action, interactable, element}`; sind keine passenden Aktionen vorhanden, enthalten die Felder `null`.
 */
function Qt(t,e,n,r,i,o,a){for(var s=0,c=r.length;s<c;s++){var l=r[s],u=i[s],p=l.getAction(e,n,t,u);if(p){var f=Jt(p,l,u,o,a);if(f)return{action:f,interactable:l,element:u}}}return{action:null,interactable:null,element:null}}/**
 * Sucht entlang der DOM-Hierarchie nach einer passenden Interactable-Aktion und liefert die gefundene Aktion, das zugehörige Interactable und das Element.
 * @param {*} t - Das ursprüngliche Pointer-/Ereignis-Argument, an die Aktionsauswahl weitergereicht.
 * @param {*} e - Weiteres Argument, an die Aktionsauswahl weitergereicht (z. B. Event- oder Typ-Information).
 * @param {*} n - Weiteres Argument, an die Aktionsauswahl weitergereicht (z. B. Koordinaten/Context).
 * @param {Element} r - Das Start-Element, von dem aus nach passenden Interactables aufwärts im DOM gesucht wird.
 * @param {*} i - Die aktuelle Scope-/Kontext-Instanz, die die Sammlung von Interactables enthält.
 * @returns {{action: *, interactable: *, element: Element|null}} Objekt mit den Feldern `action` (gefundenes Action-Objekt oder `null`), `interactable` (das zugehörige Interactable oder `null`) und `element` (das Element, auf dem die Aktion gefunden wurde, oder `null`).
 */
function Zt(t,e,n,r,i){var o=[],a=[],s=r;function c(t){o.push(t),a.push(s)}for(;w.element(s);){o=[],a=[],i.interactables.forEachMatch(s,c);var l=Qt(t,e,n,o,a,r,i);if(l.action&&!l.interactable.options[l.action.name].manualStart)return l;s=A(s)}return{action:null,interactable:null,element:null}}/**
 * Bereitet eine Interaction für einen möglichen Auto-Start vor.
 *
 * Setzt die Interactable- und Element-Referenzen der Interaction, aktualisiert deren vorbereiteten Action-Zustand
 * und das zugehörige Bounding-Rect (falls verfügbar), führt die Interaktion-Initialisierung durch und feuert
 * das `autoStart:prepared`-Event.
 *
 * @param {Object} t - Die zu aktualisierende Interaction.
 * @param {Object} e - Vorbereitungsdaten.
 * @param {Object} e.action - Die Action-Definition (z. B. `{ name: 'drag' }`).
 * @param {Object} e.interactable - Das zugehörige Interactable-Objekt.
 * @param {Element} e.element - Das Ziel-Element für die Interaction.
 * @param {Object} n - Scope-/Ereignis-Emitter-Objekt, das das `autoStart:prepared`-Event feuert.
 */
function te(t,e,n){var r=e.action,i=e.interactable,o=e.element;r=r||{name:null},t.interactable=i,t.element=o,Ut(t.prepared,r),t.rect=i&&r.name?i.getRect(o):null,ie(t,n),n.fire("autoStart:prepared",{interaction:t})}/**
 * Prüft, ob unter den konfigurierten Limits eine neue Interaktion begonnen werden darf.
 *
 * @param {Interactable} t - Das Interactable-Objekt, dessen Action-Optionen geprüft werden.
 * @param {Element} e - Das Ziel-Element der potentiellen Interaktion.
 * @param {{name: string}} n - Das Action-Objekt mit mindestens dem Feld `name`.
 * @param {Scope} r - Der Scope, der `autoStart.maxInteractions` und `interactions.list` enthält.
 * @returns {boolean} `true` wenn das Starten der Interaktion erlaubt ist, `false` ansonsten.
 */
function ee(t,e,n,r){var i=t.options,o=i[n.name].max,a=i[n.name].maxPerElement,s=r.autoStart.maxInteractions,c=0,l=0,u=0;if(!(o&&a&&s))return!1;for(var p=0,f=r.interactions.list;p<f.length;p++){var d=f[p],h=d.prepared.name;if(d.interacting()){if(++c>=s)return!1;if(d.interactable===t){if((l+=h===n.name?1:0)>=o)return!1;if(d.element===e&&(u++,h===n.name&&u>=a))return!1}}}return s>0}/**
 * Legt die maximale Anzahl gleichzeitiger Auto-Start-Interaktionen fest oder liest sie aus.
 * @param {number} t - Wenn eine Zahl, setzt sie `autoStart.maxInteractions` auf diesen Wert.
 * @param {Object} e - Optionenobjekt, das das `autoStart`-Unterobjekt enthält.
 * @returns {this|number} `this`, wenn `t` eine Zahl ist; ansonsten die aktuelle maximale Anzahl Interaktionen.
 */
function ne(t,e){return w.number(t)?(e.autoStart.maxInteractions=t,this):e.autoStart.maxInteractions}/**
 * Setzt oder entfernt den benutzerdefinierten Cursor für das gegebene Element und die Dokumentwurzel und verwaltet das gespeicherte cursorElement in den Optionen.
 *
 * Entfernt den Cursorstil vom vorher gespeicherten Element, falls vorhanden und unterschiedlich, setzt den Cursorstil der Dokumentwurzel und des übergebenen Elements auf den übergebenen Wert und aktualisiert n.autoStart.cursorElement (auf das Element bei einem truthy Wert oder auf null bei einem falsy Wert).
 *
 * @param {Element} t - Das Element, dessen Cursorstil gesetzt oder entfernt werden soll.
 * @param {string|null|undefined} e - Der zu setzende CSS-Cursor-Wert (z. B. "move"); bei falsy wird der gespeicherte cursor entfernt.
 * @param {Object} n - Konfigurationsobjekt, erwartet ein .autoStart-Objekt mit dem Feld cursorElement.
 */
function re(t,e,n){var r=n.autoStart.cursorElement;r&&r!==t&&(r.style.cursor=""),t.ownerDocument.documentElement.style.cursor=e,t.style.cursor=e,n.autoStart.cursorElement=e?t:null}/**
 * Setzt den Maus-Cursor passend zur aktuellen vorbereiteten Aktion oder entfernt ihn.
 *
 * Bestimmt anhand des Pointer-Typs und der vorbereiteten Aktion (`t.prepared`) das passende
 * Cursor-Label und wendet es auf das Interactable-Element an; wenn kein Interactable/Cursor
 * bestimmt werden kann, wird der Cursor auf einem globalen `autoStart.cursorElement` zurückgesetzt.
 *
 * @param {object} t - Objekt mit Informationen zur aktuellen Zeiger-/Interaktionssituation.
 *   Erwartete Felder: `pointerType` (z. B. "mouse"), `interactable`, `element`, `prepared` (mit `name`),
 *   und optional `_interacting`.
 * @param {object} e - Globale Kontext-/Scope-Objekt mit mindestens `actions` (Mapping der Aktionen)
 *   und `autoStart.cursorElement`.
 */
function ie(t,e){var n=t.interactable,r=t.element,i=t.prepared;if("mouse"===t.pointerType&&n&&n.options.styleCursor){var o="";if(i.name){var a=n.options[i.name].cursorChecker;o=w.func(a)?a(i,n,r,t._interacting):e.actions.map[i.name].getCursor(i)}re(t.element,o||"",e)}else e.autoStart.cursorElement&&re(e.autoStart.cursorElement,"",e)}var oe={id:"auto-start/base",before:["actions"],install:function(t){var e=t.interactStatic,n=t.defaults;t.usePlugin($t),n.base.actionChecker=null,n.base.styleCursor=!0,V(n.perAction,{manualStart:!1,max:1/0,maxPerElement:1,allowFrom:null,ignoreFrom:null,mouseButtons:1}),e.maxInteractions=function(e){return ne(e,t)},t.autoStart={maxInteractions:1/0,withinInteractionLimit:ee,cursorElement:null}},listeners:{"interactions:down":function(t,e){var n=t.interaction,r=t.pointer,i=t.event,o=t.eventTarget;n.interacting()||te(n,Zt(n,r,i,o,e),e)},"interactions:move":function(t,e){!function(t,e){var n=t.interaction,r=t.pointer,i=t.event,o=t.eventTarget;"mouse"!==n.pointerType||n.pointerIsDown||n.interacting()||te(n,Zt(n,r,i,o,e),e)}(t,e),function(t,e){var n=t.interaction;if(n.pointerIsDown&&!n.interacting()&&n.pointerWasMoved&&n.prepared.name){e.fire("autoStart:before-start",t);var r=n.interactable,i=n.prepared.name;i&&r&&(r.options[i].manualStart||!ee(r,n.element,n.prepared,e)?n.stop():(n.start(n.prepared,r,n.element),ie(n,e)))}}(t,e)},"interactions:stop":function(t,e){var n=t.interaction,r=n.interactable;r&&r.options.styleCursor&&re(n.element,"",e)}},maxInteractions:ne,withinInteractionLimit:ee,validateAction:Jt},ae=oe;var se={id:"auto-start/dragAxis",listeners:{"autoStart:before-start":function(t,e){var n=t.interaction,r=t.eventTarget,i=t.dx,o=t.dy;if("drag"===n.prepared.name){var a=Math.abs(i),s=Math.abs(o),c=n.interactable.options.drag,l=c.startAxis,u=a>s?"x":a<s?"y":"xy";if(n.prepared.axis="start"===c.lockAxis?u[0]:c.lockAxis,"xy"!==u&&"xy"!==l&&l!==u){n.prepared.name=null;for(var p=r,f=function(t){if(t!==n.interactable){var i=n.interactable.options.drag;if(!i.manualStart&&t.testIgnoreAllow(i,p,r)){var o=t.getAction(n.downPointer,n.downEvent,n,p);if(o&&"drag"===o.name&&function(t,e){if(!e)return!1;var n=e.options.drag.startAxis;return"xy"===t||"xy"===n||n===t}(u,t)&&ae.validateAction(o,t,p,r,e))return t}}};w.element(p);){var d=e.interactables.forEachMatch(p,f);if(d){n.prepared.name="drag",n.interactable=d,n.element=p;break}p=A(p)}}}}}};/**
 * Gibt den Hold- oder Delay-Wert der aktuell vorbereiteten Aktion zurück.
 * @param {Object} t - Objekt mit dem Zustand der Interaktion; erwartet mindestens `prepared.name` und `interactable.options`.
 * @returns {*} Der Wert von `interactable.options[prepared.name].hold`, oder falls dieser nicht gesetzt ist, der Wert von `...delay`; `null`, wenn keine vorbereitete Aktion vorhanden ist.
 */
function ce(t){var e=t.prepared&&t.prepared.name;if(!e)return null;var n=t.interactable.options;return n[e].hold||n[e].delay}var le={id:"auto-start/hold",install:function(t){var e=t.defaults;t.usePlugin(ae),e.perAction.hold=0,e.perAction.delay=0},listeners:{"interactions:new":function(t){t.interaction.autoStartHoldTimer=null},"autoStart:prepared":function(t){var e=t.interaction,n=ce(e);n>0&&(e.autoStartHoldTimer=setTimeout((function(){e.start(e.prepared,e.interactable,e.element)}),n))},"interactions:move":function(t){var e=t.interaction,n=t.duplicate;e.autoStartHoldTimer&&e.pointerWasMoved&&!n&&(clearTimeout(e.autoStartHoldTimer),e.autoStartHoldTimer=null)},"autoStart:before-start":function(t){var e=t.interaction;ce(e)>0&&(e.prepared.name=null)}},getHoldDuration:ce},ue=le,pe={id:"auto-start",install:function(t){t.usePlugin(ae),t.usePlugin(ue),t.usePlugin(se)}},fe=function(t){return/^(always|never|auto)$/.test(t)?(this.options.preventDefault=t,this):w.bool(t)?(this.options.preventDefault=t?"always":"never",this):this.options.preventDefault};/**
 * Verhindert ggf. das Standardverhalten des übergebenen Events, wenn das zugeordnete Interactable dies verlangt.
 *
 * @param {Object} t - Objekt mit Kontext für die Prüfung.
 * @param {Object} t.interaction - Die aktuelle Interaction-Instanz, die eine Interactable-Referenz enthalten kann.
 * @param {Event} t.event - Das Event, dessen Standardverhalten unterdrückt werden kann.
 */
function de(t){var e=t.interaction,n=t.event;e.interactable&&e.interactable.checkAndPreventDefault(n)}var he={id:"core/interactablePreventDefault",install:function(t){var e=t.Interactable;e.prototype.preventDefault=fe,e.prototype.checkAndPreventDefault=function(e){return function(t,e,n){var r=t.options.preventDefault;if("never"!==r)if("always"!==r){if(e.events.supportsPassive&&/^touch(start|move)$/.test(n.type)){var i=y(n.target).document,o=e.getDocOptions(i);if(!o||!o.events||!1!==o.events.passive)return}/^(mouse|pointer|touch)*(down|start)/i.test(n.type)||w.element(n.target)&&R(n.target,"input,select,textarea,[contenteditable=true],[contenteditable=true] *")||n.preventDefault()}else n.preventDefault()}(this,t,e)},t.interactions.docEvents.push({type:"dragstart",listener:function(e){for(var n=0,r=t.interactions.list;n<r.length;n++){var i=r[n];if(i.element&&(i.element===e.target||M(i.element,e.target)))return void i.interactable.checkAndPreventDefault(e)}}})},listeners:["down","move","up","cancel"].reduce((function(t,e){return t["interactions:".concat(e)]=de,t}),{})};/**
 * Prüft, ob ein Ereignistyp phasenlos ist oder einer phasenlosen Phase zugeordnet werden kann.
 * @param {string} t - Der Ereignistypname.
 * @param {object} e - Ereignis-Registry-Objekt mit den Feldern `phaselessTypes`, `map` und `phases`.
 *                      `phaselessTypes` ist eine Menge/Lookup bereits phasenloser Typen;
 *                      `map` ordnet Präfixe zu; `phases` enthält gültige Phasenamen.
 * @return {boolean} `true`, wenn der Typ in `phaselessTypes` steht oder ein in `map` passendes Präfix
 *                   gefunden wird und die nachfolgende Teilzeichenkette in `phases` vorhanden ist, `false` sonst.
 */
function ve(t,e){if(e.phaselessTypes[t])return!0;for(var n in e.map)if(0===t.indexOf(n)&&t.substr(n.length)in e.phases)return!0;return!1}/**
 * Erzeugt eine Kopie eines Objekts, wobei verschachtelte Plain-Objects rekursiv kopiert und Arrays kopiert werden.
 *
 * Kopiert für jeden Schlüssel:
 * - Plain-Objects werden rekursiv kopiert (tiefe Kopie).
 * - Arrays werden in eine neue Array-Instanz kopiert.
 * - Alle anderen Werte werden unverändert (Referenz/Zuweisung) übernommen.
 *
 * @param {Object} t - Das Quellobjekt, dessen Eigenschaften kopiert werden sollen.
 * @returns {Object} Eine neue Objektinstanz mit kopierten Werten gemäß obiger Regeln.
 */
function ge(t){var e={};for(var n in t){var r=t[n];w.plainObject(r)?e[n]=ge(r):w.array(r)?e[n]=mt(r):e[n]=r}return e}var me=function(){/**
 * Initialisiert einen Status-Container zur Verfolgung von Kanten- und Ergebniszuständen für eine Interaction.
 * Dieser Konstruktor legt Standardwerte für Offsets, Kantenflags und Ergebnisobjekte an.
 * @constructor
 * @param {Object} interaction - Die Interaction-Instanz, für die der Status verwaltet wird.
 */
function t(e){r(this,t),this.states=[],this.startOffset={left:0,right:0,top:0,bottom:0},this.startDelta=void 0,this.result=void 0,this.endResult=void 0,this.startEdges=void 0,this.edges=void 0,this.interaction=void 0,this.interaction=e,this.result=ye(),this.edges={left:!1,right:!1,top:!1,bottom:!1}}return o(t,[{key:"start",value:function(t,e){var n,r,i=t.phase,o=this.interaction,a=function(t){var e=t.interactable.options[t.prepared.name],n=e.modifiers;if(n&&n.length)return n;return["snap","snapSize","snapEdges","restrict","restrictEdges","restrictSize"].map((function(t){var n=e[t];return n&&n.enabled&&{options:n,methods:n._methods}})).filter((function(t){return!!t}))}(o);this.prepareStates(a),this.startEdges=V({},o.edges),this.edges=V({},this.startEdges),this.startOffset=(n=o.rect,r=e,n?{left:r.x-n.left,top:r.y-n.top,right:n.right-r.x,bottom:n.bottom-r.y}:{left:0,top:0,right:0,bottom:0}),this.startDelta={x:0,y:0};var s=this.fillArg({phase:i,pageCoords:e,preEnd:!1});return this.result=ye(),this.startAll(s),this.result=this.setAll(s)}},{key:"fillArg",value:function(t){var e=this.interaction;return t.interaction=e,t.interactable=e.interactable,t.element=e.element,t.rect||(t.rect=e.rect),t.edges||(t.edges=this.startEdges),t.startOffset=this.startOffset,t}},{key:"startAll",value:function(t){for(var e=0,n=this.states;e<n.length;e++){var r=n[e];r.methods.start&&(t.state=r,r.methods.start(t))}}},{key:"setAll",value:function(t){var e=t.phase,n=t.preEnd,r=t.skipModifiers,i=t.rect,o=t.edges;t.coords=V({},t.pageCoords),t.rect=V({},i),t.edges=V({},o);for(var a=r?this.states.slice(r):this.states,s=ye(t.coords,t.rect),c=0;c<a.length;c++){var l,u=a[c],p=u.options,f=V({},t.coords),d=null;null!=(l=u.methods)&&l.set&&this.shouldDo(p,n,e)&&(t.state=u,d=u.methods.set(t),H(t.edges,t.rect,{x:t.coords.x-f.x,y:t.coords.y-f.y})),s.eventProps.push(d)}V(this.edges,t.edges),s.delta.x=t.coords.x-t.pageCoords.x,s.delta.y=t.coords.y-t.pageCoords.y,s.rectDelta.left=t.rect.left-i.left,s.rectDelta.right=t.rect.right-i.right,s.rectDelta.top=t.rect.top-i.top,s.rectDelta.bottom=t.rect.bottom-i.bottom;var h=this.result.coords,v=this.result.rect;if(h&&v){var g=s.rect.left!==v.left||s.rect.right!==v.right||s.rect.top!==v.top||s.rect.bottom!==v.bottom;s.changed=g||h.x!==s.coords.x||h.y!==s.coords.y}return s}},{key:"applyToInteraction",value:function(t){var e=this.interaction,n=t.phase,r=e.coords.cur,i=e.coords.start,o=this.result,a=this.startDelta,s=o.delta;"start"===n&&V(this.startDelta,o.delta);for(var c=0,l=[[i,a],[r,s]];c<l.length;c++){var u=l[c],p=u[0],f=u[1];p.page.x+=f.x,p.page.y+=f.y,p.client.x+=f.x,p.client.y+=f.y}var d=this.result.rectDelta,h=t.rect||e.rect;h.left+=d.left,h.right+=d.right,h.top+=d.top,h.bottom+=d.bottom,h.width=h.right-h.left,h.height=h.bottom-h.top}},{key:"setAndApply",value:function(t){var e=this.interaction,n=t.phase,r=t.preEnd,i=t.skipModifiers,o=this.setAll(this.fillArg({preEnd:r,phase:n,pageCoords:t.modifiedCoords||e.coords.cur.page}));if(this.result=o,!o.changed&&(!i||i<this.states.length)&&e.interacting())return!1;if(t.modifiedCoords){var a=e.coords.cur.page,s={x:t.modifiedCoords.x-a.x,y:t.modifiedCoords.y-a.y};o.coords.x+=s.x,o.coords.y+=s.y,o.delta.x+=s.x,o.delta.y+=s.y}this.applyToInteraction(t)}},{key:"beforeEnd",value:function(t){var e=t.interaction,n=t.event,r=this.states;if(r&&r.length){for(var i=!1,o=0;o<r.length;o++){var a=r[o];t.state=a;var s=a.options,c=a.methods,l=c.beforeEnd&&c.beforeEnd(t);if(l)return this.endResult=l,!1;i=i||!i&&this.shouldDo(s,!0,t.phase,!0)}i&&e.move({event:n,preEnd:!0})}}},{key:"stop",value:function(t){var e=t.interaction;if(this.states&&this.states.length){var n=V({states:this.states,interactable:e.interactable,element:e.element,rect:null},t);this.fillArg(n);for(var r=0,i=this.states;r<i.length;r++){var o=i[r];n.state=o,o.methods.stop&&o.methods.stop(n)}this.states=null,this.endResult=null}}},{key:"prepareStates",value:function(t){this.states=[];for(var e=0;e<t.length;e++){var n=t[e],r=n.options,i=n.methods,o=n.name;this.states.push({options:r,methods:i,index:e,name:o})}return this.states}},{key:"restoreInteractionCoords",value:function(t){var e=t.interaction,n=e.coords,r=e.rect,i=e.modification;if(i.result){for(var o=i.startDelta,a=i.result,s=a.delta,c=a.rectDelta,l=0,u=[[n.start,o],[n.cur,s]];l<u.length;l++){var p=u[l],f=p[0],d=p[1];f.page.x-=d.x,f.page.y-=d.y,f.client.x-=d.x,f.client.y-=d.y}r.left-=c.left,r.right-=c.right,r.top-=c.top,r.bottom-=c.bottom}}},{key:"shouldDo",value:function(t,e,n,r){return!(!t||!1===t.enabled||r&&!t.endOnly||t.endOnly&&!e||"start"===n&&!t.setStart)}},{key:"copyFrom",value:function(t){this.startOffset=t.startOffset,this.startDelta=t.startDelta,this.startEdges=t.startEdges,this.edges=t.edges,this.states=t.states.map((function(t){return ge(t)})),this.result=ye(V({},t.result.coords),V({},t.result.rect))}},{key:"destroy",value:function(){for(var t in this)this[t]=null}}]),t}();/**
 * Erzeugt ein initiales Ergebnisobjekt für eine Interaktion oder Modifikation mit vorgegebenen Koordinaten und Rechteck.
 * @param {Object} t - Die Koordinaten für das Ergebnis (z. B. `{ x, y }` oder `{ page, client }`).
 * @param {Object} e - Das zugeordnete Rechteck/Bounding-Box für das Ergebnis.
 * @returns {Object} Ein Objekt mit den Eigenschaften:
 *  - `rect`: das übergebene Rechteck,
 *  - `coords`: die übergebenen Koordinaten,
 *  - `delta`: `{ x: 0, y: 0 }`,
 *  - `rectDelta`: `{ left: 0, right: 0, top: 0, bottom: 0 }`,
 *  - `eventProps`: ein leeres Array,
 *  - `changed`: `true`.
 */
function ye(t,e){return{rect:e,coords:t,delta:{x:0,y:0},rectDelta:{left:0,right:0,top:0,bottom:0},eventProps:[],changed:!0}}/**
 * Erstellt eine Fabrikfunktion für eine Aktion/Plugin, die Standardoptionen mit benutzerdefinierten Optionen kombiniert und ein konfigurierbares, aktivierbares Instanzobjekt liefert.
 *
 * @param {Object} t - Beschreibung des Aktionstyps.
 * @param {Object} t.defaults - Standardoptionen für die Aktion.
 * @param {Function} [t.start] - Methode für Start-Verhalten (wird als Teil der Methoden zurückgegeben).
 * @param {Function} [t.set] - Methode zum Anwenden/Setzen während der Aktion.
 * @param {Function} [t.beforeEnd] - Methode, die vor dem Beenden der Aktion aufgerufen wird.
 * @param {Function} [t.stop] - Methode für Stopp-Verhalten.
 * @param {string} [e] - Optionaler Name für die Aktion; wenn eine Zeichenkette übergeben wird, werden die Fabrik-Defaults und -Methoden auf der Fabrikfunktion als `_defaults` bzw. `_methods` abgelegt.
 * @returns {Function} Eine Fabrikfunktion (options?) => instance, die beim Aufruf ein Objekt zurückgibt mit den Feldern:
 *   - options: die zusammengeführten Optionen (benutzerdefiniert übergebene Werte übersteuern Defaults),
 *   - methods: die extern bereitgestellten Aktionsmethoden (start/set/beforeEnd/stop),
 *   - name: der angegebene Name (falls vorhanden),
 *   - enable(): setzt `options.enabled = true` und gibt die Instanz zurück,
 *   - disable(): setzt `options.enabled = false` und gibt die Instanz zurück.
 */
function be(t,e){var n=t.defaults,r={start:t.start,set:t.set,beforeEnd:t.beforeEnd,stop:t.stop},i=function(t){var i=t||{};for(var o in i.enabled=!1!==i.enabled,n)o in i||(i[o]=n[o]);var a={options:i,methods:r,name:e,enable:function(){return i.enabled=!0,a},disable:function(){return i.enabled=!1,a}};return a};return e&&"string"==typeof e&&(i._defaults=n,i._methods=r),i}/**
 * Fügt, falls vorhanden, die von Modifiers berechneten Ereigniseigenschaften zum internen Event-Objekt hinzu.
 * @param {Object} t - Kontextobjekt mit `iEvent` (das interne Event) und `interaction.modification.result` (das Ergebnis der Modifikationen).
 */
function xe(t){var e=t.iEvent,n=t.interaction.modification.result;n&&(e.modifiers=n.eventProps)}var we={id:"modifiers/base",before:["actions"],install:function(t){t.defaults.perAction.modifiers=[]},listeners:{"interactions:new":function(t){var e=t.interaction;e.modification=new me(e)},"interactions:before-action-start":function(t){var e=t.interaction,n=t.interaction.modification;n.start(t,e.coords.start.page),e.edges=n.edges,n.applyToInteraction(t)},"interactions:before-action-move":function(t){var e=t.interaction,n=e.modification,r=n.setAndApply(t);return e.edges=n.edges,r},"interactions:before-action-end":function(t){var e=t.interaction,n=e.modification,r=n.beforeEnd(t);return e.edges=n.startEdges,r},"interactions:action-start":xe,"interactions:action-move":xe,"interactions:action-end":xe,"interactions:after-action-start":function(t){return t.interaction.modification.restoreInteractionCoords(t)},"interactions:after-action-move":function(t){return t.interaction.modification.restoreInteractionCoords(t)},"interactions:stop":function(t){return t.interaction.modification.stop(t)}}},Ee=we,Te={base:{preventDefault:"auto",deltaSource:"page"},perAction:{enabled:!1,origin:{x:0,y:0}},actions:{}},Se=function(t){s(n,t);var e=p(n);/**
 * Erstellt ein normalisiertes Interaktionsereignis-Objekt mit berechneten Koordinaten, Zustands- und Metadaten für die gegebene Interaction.
 *
 * @param {Object} t - Die Interaction-Instanz, die den aktuellen Zeiger-/Aktionszustand enthält.
 * @param {Event} i - Das native Pointer-/Mouse-/Touch-Event, von dem Tasten- und Modifikatorzustände übernommen werden.
 * @param {string} o - Der Basisereignistyp (z. B. "drag", "resize", "gesture").
 * @param {string} [a] - Die Aktionsphase ("start", "move", "end" oder spezielle Phasen wie "inertiastart").
 * @param {Element} [s] - Das Ziel-Element für das erzeugte Ereignis; falls nicht angegeben, wird t.element verwendet.
 * @param {boolean} [c] - Kennzeichnung für ein bevorstehendes Ende (preEnd) des Events.
 * @param {string} [l] - Optionaler kompletter Ereignistyp-Override; wenn gesetzt, wird dieser statt der Kombination aus o und a verwendet.
 * @returns {Object} Das erzeugte Ereignisobjekt mit Eigenschaften wie page, client, rect, delta, velocity, speed, swipe, target, type und weiteren Metadaten.
 */
function n(t,i,o,a,s,c,l){var p;r(this,n),(p=e.call(this,t)).relatedTarget=null,p.screenX=void 0,p.screenY=void 0,p.button=void 0,p.buttons=void 0,p.ctrlKey=void 0,p.shiftKey=void 0,p.altKey=void 0,p.metaKey=void 0,p.page=void 0,p.client=void 0,p.delta=void 0,p.rect=void 0,p.x0=void 0,p.y0=void 0,p.t0=void 0,p.dt=void 0,p.duration=void 0,p.clientX0=void 0,p.clientY0=void 0,p.velocity=void 0,p.speed=void 0,p.swipe=void 0,p.axes=void 0,p.preEnd=void 0,s=s||t.element;var f=t.interactable,d=(f&&f.options||Te).deltaSource,h=K(f,s,o),v="start"===a,g="end"===a,m=v?u(p):t.prevEvent,y=v?t.coords.start:g?{page:m.page,client:m.client,timeStamp:t.coords.cur.timeStamp}:t.coords.cur;return p.page=V({},y.page),p.client=V({},y.client),p.rect=V({},t.rect),p.timeStamp=y.timeStamp,g||(p.page.x-=h.x,p.page.y-=h.y,p.client.x-=h.x,p.client.y-=h.y),p.ctrlKey=i.ctrlKey,p.altKey=i.altKey,p.shiftKey=i.shiftKey,p.metaKey=i.metaKey,p.button=i.button,p.buttons=i.buttons,p.target=s,p.currentTarget=s,p.preEnd=c,p.type=l||o+(a||""),p.interactable=f,p.t0=v?t.pointers[t.pointers.length-1].downTime:m.t0,p.x0=t.coords.start.page.x-h.x,p.y0=t.coords.start.page.y-h.y,p.clientX0=t.coords.start.client.x-h.x,p.clientY0=t.coords.start.client.y-h.y,p.delta=v||g?{x:0,y:0}:{x:p[d].x-m[d].x,y:p[d].y-m[d].y},p.dt=t.coords.delta.timeStamp,p.duration=p.timeStamp-p.t0,p.velocity=V({},t.coords.velocity[d]),p.speed=Q(p.velocity.x,p.velocity.y),p.swipe=g||"inertiastart"===a?p.getSwipe():null,p}return o(n,[{key:"getSwipe",value:function(){var t=this._interaction;if(t.prevEvent.speed<600||this.timeStamp-t.prevEvent.timeStamp>150)return null;var e=180*Math.atan2(t.prevEvent.velocityY,t.prevEvent.velocityX)/Math.PI;e<0&&(e+=360);var n=112.5<=e&&e<247.5,r=202.5<=e&&e<337.5;return{up:r,down:!r&&22.5<=e&&e<157.5,left:n,right:!n&&(292.5<=e||e<67.5),angle:e,speed:t.prevEvent.speed,velocity:{x:t.prevEvent.velocityX,y:t.prevEvent.velocityY}}}},{key:"preventDefault",value:function(){}},{key:"stopImmediatePropagation",value:function(){this.immediatePropagationStopped=this.propagationStopped=!0}},{key:"stopPropagation",value:function(){this.propagationStopped=!0}}]),n}(vt);Object.defineProperties(Se.prototype,{pageX:{get:function(){return this.page.x},set:function(t){this.page.x=t}},pageY:{get:function(){return this.page.y},set:function(t){this.page.y=t}},clientX:{get:function(){return this.client.x},set:function(t){this.client.x=t}},clientY:{get:function(){return this.client.y},set:function(t){this.client.y=t}},dx:{get:function(){return this.delta.x},set:function(t){this.delta.x=t}},dy:{get:function(){return this.delta.y},set:function(t){this.delta.y=t}},velocityX:{get:function(){return this.velocity.x},set:function(t){this.velocity.x=t}},velocityY:{get:function(){return this.velocity.y},set:function(t){this.velocity.y=t}}});var _e=o((function t(e,n,i,o,a){r(this,t),this.id=void 0,this.pointer=void 0,this.event=void 0,this.downTime=void 0,this.downTarget=void 0,this.id=e,this.pointer=n,this.event=i,this.downTime=o,this.downTarget=a})),Pe=function(t){return t.interactable="",t.element="",t.prepared="",t.pointerIsDown="",t.pointerWasMoved="",t._proxy="",t}({}),Oe=function(t){return t.start="",t.move="",t.end="",t.stop="",t.interacting="",t}({}),ke=0,De=function(){/**
 * Erstellt ein neues Interaction‑Objekt und initialisiert dessen internen Zustand.
 * @constructor
 * @param {Object} e - Initialisierungsoptionen.
 * @param {string} e.pointerType - Der anfängliche Zeigertyp (z. B. "mouse", "touch", "pen").
 * @param {Function} e.scopeFire - Funktion zum Auslösen von Scope‑Ereignissen; wird verwendet, um das Ereignis "interactions:new" mit dem neuen Interaction‑Objekt zu feuern.
 */
function t(e){var n=this,i=e.pointerType,o=e.scopeFire;r(this,t),this.interactable=null,this.element=null,this.rect=null,this._rects=void 0,this.edges=null,this._scopeFire=void 0,this.prepared={name:null,axis:null,edges:null},this.pointerType=void 0,this.pointers=[],this.downEvent=null,this.downPointer={},this._latestPointer={pointer:null,event:null,eventTarget:null},this.prevEvent=null,this.pointerIsDown=!1,this.pointerWasMoved=!1,this._interacting=!1,this._ending=!1,this._stopped=!0,this._proxy=void 0,this.simulation=null,this.doMove=Nt((function(t){this.move(t)}),"The interaction.doMove() method has been renamed to interaction.move()"),this.coords={start:{page:{x:0,y:0},client:{x:0,y:0},timeStamp:0},prev:{page:{x:0,y:0},client:{x:0,y:0},timeStamp:0},cur:{page:{x:0,y:0},client:{x:0,y:0},timeStamp:0},delta:{page:{x:0,y:0},client:{x:0,y:0},timeStamp:0},velocity:{page:{x:0,y:0},client:{x:0,y:0},timeStamp:0}},this._id=ke++,this._scopeFire=o,this.pointerType=i;var a=this;this._proxy={};var s=function(t){Object.defineProperty(n._proxy,t,{get:function(){return a[t]}})};for(var c in Pe)s(c);var l=function(t){Object.defineProperty(n._proxy,t,{value:function(){return a[t].apply(a,arguments)}})};for(var u in Oe)l(u);this._scopeFire("interactions:new",{interaction:this})}return o(t,[{key:"pointerMoveTolerance",get:function(){return 1}},{key:"pointerDown",value:function(t,e,n){var r=this.updatePointer(t,e,n,!0),i=this.pointers[r];this._scopeFire("interactions:down",{pointer:t,event:e,eventTarget:n,pointerIndex:r,pointerInfo:i,type:"down",interaction:this})}},{key:"start",value:function(t,e,n){return!(this.interacting()||!this.pointerIsDown||this.pointers.length<("gesture"===t.name?2:1)||!e.options[t.name].enabled)&&(Ut(this.prepared,t),this.interactable=e,this.element=n,this.rect=e.getRect(n),this.edges=this.prepared.edges?V({},this.prepared.edges):{left:!0,right:!0,top:!0,bottom:!0},this._stopped=!1,this._interacting=this._doPhase({interaction:this,event:this.downEvent,phase:"start"})&&!this._stopped,this._interacting)}},{key:"pointerMove",value:function(t,e,n){this.simulation||this.modification&&this.modification.endResult||this.updatePointer(t,e,n,!1);var r,i,o=this.coords.cur.page.x===this.coords.prev.page.x&&this.coords.cur.page.y===this.coords.prev.page.y&&this.coords.cur.client.x===this.coords.prev.client.x&&this.coords.cur.client.y===this.coords.prev.client.y;this.pointerIsDown&&!this.pointerWasMoved&&(r=this.coords.cur.client.x-this.coords.start.client.x,i=this.coords.cur.client.y-this.coords.start.client.y,this.pointerWasMoved=Q(r,i)>this.pointerMoveTolerance);var a,s,c,l=this.getPointerIndex(t),u={pointer:t,pointerIndex:l,pointerInfo:this.pointers[l],event:e,type:"move",eventTarget:n,dx:r,dy:i,duplicate:o,interaction:this};o||(a=this.coords.velocity,s=this.coords.delta,c=Math.max(s.timeStamp/1e3,.001),a.page.x=s.page.x/c,a.page.y=s.page.y/c,a.client.x=s.client.x/c,a.client.y=s.client.y/c,a.timeStamp=c),this._scopeFire("interactions:move",u),o||this.simulation||(this.interacting()&&(u.type=null,this.move(u)),this.pointerWasMoved&&et(this.coords.prev,this.coords.cur))}},{key:"move",value:function(t){t&&t.event||nt(this.coords.delta),(t=V({pointer:this._latestPointer.pointer,event:this._latestPointer.event,eventTarget:this._latestPointer.eventTarget,interaction:this},t||{})).phase="move",this._doPhase(t)}},{key:"pointerUp",value:function(t,e,n,r){var i=this.getPointerIndex(t);-1===i&&(i=this.updatePointer(t,e,n,!1));var o=/cancel$/i.test(e.type)?"cancel":"up";this._scopeFire("interactions:".concat(o),{pointer:t,pointerIndex:i,pointerInfo:this.pointers[i],event:e,eventTarget:n,type:o,curEventTarget:r,interaction:this}),this.simulation||this.end(e),this.removePointer(t,e)}},{key:"documentBlur",value:function(t){this.end(t),this._scopeFire("interactions:blur",{event:t,type:"blur",interaction:this})}},{key:"end",value:function(t){var e;this._ending=!0,t=t||this._latestPointer.event,this.interacting()&&(e=this._doPhase({event:t,interaction:this,phase:"end"})),this._ending=!1,!0===e&&this.stop()}},{key:"currentAction",value:function(){return this._interacting?this.prepared.name:null}},{key:"interacting",value:function(){return this._interacting}},{key:"stop",value:function(){this._scopeFire("interactions:stop",{interaction:this}),this.interactable=this.element=null,this._interacting=!1,this._stopped=!0,this.prepared.name=this.prevEvent=null}},{key:"getPointerIndex",value:function(t){var e=at(t);return"mouse"===this.pointerType||"pen"===this.pointerType?this.pointers.length-1:yt(this.pointers,(function(t){return t.id===e}))}},{key:"getPointerInfo",value:function(t){return this.pointers[this.getPointerIndex(t)]}},{key:"updatePointer",value:function(t,e,n,r){var i,o,a,s=at(t),c=this.getPointerIndex(t),l=this.pointers[c];return r=!1!==r&&(r||/(down|start)$/i.test(e.type)),l?l.pointer=t:(l=new _e(s,t,e,null,null),c=this.pointers.length,this.pointers.push(l)),st(this.coords.cur,this.pointers.map((function(t){return t.pointer})),this._now()),i=this.coords.delta,o=this.coords.prev,a=this.coords.cur,i.page.x=a.page.x-o.page.x,i.page.y=a.page.y-o.page.y,i.client.x=a.client.x-o.client.x,i.client.y=a.client.y-o.client.y,i.timeStamp=a.timeStamp-o.timeStamp,r&&(this.pointerIsDown=!0,l.downTime=this.coords.cur.timeStamp,l.downTarget=n,tt(this.downPointer,t),this.interacting()||(et(this.coords.start,this.coords.cur),et(this.coords.prev,this.coords.cur),this.downEvent=e,this.pointerWasMoved=!1)),this._updateLatestPointer(t,e,n),this._scopeFire("interactions:update-pointer",{pointer:t,event:e,eventTarget:n,down:r,pointerInfo:l,pointerIndex:c,interaction:this}),c}},{key:"removePointer",value:function(t,e){var n=this.getPointerIndex(t);if(-1!==n){var r=this.pointers[n];this._scopeFire("interactions:remove-pointer",{pointer:t,event:e,eventTarget:null,pointerIndex:n,pointerInfo:r,interaction:this}),this.pointers.splice(n,1),this.pointerIsDown=!1}}},{key:"_updateLatestPointer",value:function(t,e,n){this._latestPointer.pointer=t,this._latestPointer.event=e,this._latestPointer.eventTarget=n}},{key:"destroy",value:function(){this._latestPointer.pointer=null,this._latestPointer.event=null,this._latestPointer.eventTarget=null}},{key:"_createPreparedEvent",value:function(t,e,n,r){return new Se(this,t,this.prepared.name,e,this.element,n,r)}},{key:"_fireEvent",value:function(t){var e;null==(e=this.interactable)||e.fire(t),(!this.prevEvent||t.timeStamp>=this.prevEvent.timeStamp)&&(this.prevEvent=t)}},{key:"_doPhase",value:function(t){var e=t.event,n=t.phase,r=t.preEnd,i=t.type,o=this.rect;if(o&&"move"===n&&(H(this.edges,o,this.coords.delta[this.interactable.options.deltaSource]),o.width=o.right-o.left,o.height=o.bottom-o.top),!1===this._scopeFire("interactions:before-action-".concat(n),t))return!1;var a=t.iEvent=this._createPreparedEvent(e,n,r,i);return this._scopeFire("interactions:action-".concat(n),t),"start"===n&&(this.prevEvent=a),this._fireEvent(a),this._scopeFire("interactions:after-action-".concat(n),t),!0}},{key:"_now",value:function(){return Date.now()}}]),t}();/**
 * Übergibt das `interaction`-Objekt des übergebenen Kontexts an die Freigabefunktion.
 * @param {{ interaction: Object }} t - Objekt, das das zu übergebende `interaction`-Property enthält.
 */
function Ie(t){Me(t.interaction)}/**
 * Wendet vorhandene ausstehende Versatzwerte auf die aktuelle Interaktionsposition und Kanten an.
 *
 * Wenn ein nicht-null Ausgleich in `t.offset.pending` vorhanden ist, addiert die Funktion diesen Versatz
 * zu `t.coords.cur` und `t.coords.delta`, passt die Kanten `t.edges` anhand von `t.rect` an und setzt
 * die ausstehenden Versatzwerte anschließend auf 0 zurück.
 *
 * @param {Object} t - Objekt mit Interaktionszustand; muss die Felder `offset.pending`, `coords.cur`, `coords.delta`, `edges` und `rect` enthalten.
 * @returns {boolean} `true`, wenn ein ausstehender Versatz gefunden und angewendet wurde, `false` ansonsten.
 */
function Me(t){if(!function(t){return!(!t.offset.pending.x&&!t.offset.pending.y)}(t))return!1;var e=t.offset.pending;return Ae(t.coords.cur,e),Ae(t.coords.delta,e),H(t.edges,t.rect,e),e.x=0,e.y=0,!0}/**
 * Addiert die x- und y-Komponenten eines Vektors zu den ausstehenden und kumulierten Offsets.
 * @param {{x:number, y:number}} t - Vektor mit den hinzuzufügenden x- und y-Werten.
 */
function ze(t){var e=t.x,n=t.y;this.offset.pending.x+=e,this.offset.pending.y+=n,this.offset.total.x+=e,this.offset.total.y+=n}/**
 * Verschiebt die Seiten- und Client-Koordinaten eines Ereignis-/Positionsobjekts um einen gegebenen Versatz.
 * @param {{page: {x: number, y: number}, client: {x: number, y: number}}} t - Objekt mit `page`- und `client`-Koordinaten, die verändert werden.
 * @param {{x: number, y: number}} e - Versatz, der zu den `x`- und `y`-Werten addiert wird.
 */
function Ae(t,e){var n=t.page,r=t.client,i=e.x,o=e.y;n.x+=i,n.y+=o,r.x+=i,r.y+=o}Oe.offsetBy="";var Re={id:"offset",before:["modifiers","pointer-events","actions","inertia"],install:function(t){t.Interaction.prototype.offsetBy=ze},listeners:{"interactions:new":function(t){t.interaction.offset={total:{x:0,y:0},pending:{x:0,y:0}}},"interactions:update-pointer":function(t){return function(t){t.pointerIsDown&&(Ae(t.coords.cur,t.offset.total),t.offset.pending.x=0,t.offset.pending.y=0)}(t.interaction)},"interactions:before-action-start":Ie,"interactions:before-action-move":Ie,"interactions:before-action-end":function(t){var e=t.interaction;if(Me(e))return e.move({offset:!0}),e.end(),!1},"interactions:stop":function(t){var e=t.interaction;e.offset.total.x=0,e.offset.total.y=0,e.offset.pending.x=0,e.offset.pending.y=0}}},Ce=Re;var je=function(){/**
 * Repräsentiert den Zustand eines Modifiers für eine bestimmte Interaction.
 *
 * Enthält Zustandswerte, Flags und temporäre Messgrößen, die während
 * der Modifikationsphase (z. B. snap, restrict, etc.) einer Interaction genutzt werden.
 *
 * @constructor
 * @param {Object} e - Die zugehörige Interaction, für die dieser Modifier-Zustand angelegt wird.
 */
function t(e){r(this,t),this.active=!1,this.isModified=!1,this.smoothEnd=!1,this.allowResume=!1,this.modification=void 0,this.modifierCount=0,this.modifierArg=void 0,this.startCoords=void 0,this.t0=0,this.v0=0,this.te=0,this.targetOffset=void 0,this.modifiedOffset=void 0,this.currentOffset=void 0,this.lambda_v0=0,this.one_ve_v0=0,this.timeout=void 0,this.interaction=void 0,this.interaction=e}return o(t,[{key:"start",value:function(t){var e=this.interaction,n=Fe(e);if(!n||!n.enabled)return!1;var r=e.coords.velocity.client,i=Q(r.x,r.y),o=this.modification||(this.modification=new me(e));if(o.copyFrom(e.modification),this.t0=e._now(),this.allowResume=n.allowResume,this.v0=i,this.currentOffset={x:0,y:0},this.startCoords=e.coords.cur.page,this.modifierArg=o.fillArg({pageCoords:this.startCoords,preEnd:!0,phase:"inertiastart"}),this.t0-e.coords.cur.timeStamp<50&&i>n.minSpeed&&i>n.endSpeed)this.startInertia();else{if(o.result=o.setAll(this.modifierArg),!o.result.changed)return!1;this.startSmoothEnd()}return e.modification.result.rect=null,e.offsetBy(this.targetOffset),e._doPhase({interaction:e,event:t,phase:"inertiastart"}),e.offsetBy({x:-this.targetOffset.x,y:-this.targetOffset.y}),e.modification.result.rect=null,this.active=!0,e.simulation=this,!0}},{key:"startInertia",value:function(){var t=this,e=this.interaction.coords.velocity.client,n=Fe(this.interaction),r=n.resistance,i=-Math.log(n.endSpeed/this.v0)/r;this.targetOffset={x:(e.x-i)/r,y:(e.y-i)/r},this.te=i,this.lambda_v0=r/this.v0,this.one_ve_v0=1-n.endSpeed/this.v0;var o=this.modification,a=this.modifierArg;a.pageCoords={x:this.startCoords.x+this.targetOffset.x,y:this.startCoords.y+this.targetOffset.y},o.result=o.setAll(a),o.result.changed&&(this.isModified=!0,this.modifiedOffset={x:this.targetOffset.x+o.result.delta.x,y:this.targetOffset.y+o.result.delta.y}),this.onNextFrame((function(){return t.inertiaTick()}))}},{key:"startSmoothEnd",value:function(){var t=this;this.smoothEnd=!0,this.isModified=!0,this.targetOffset={x:this.modification.result.delta.x,y:this.modification.result.delta.y},this.onNextFrame((function(){return t.smoothEndTick()}))}},{key:"onNextFrame",value:function(t){var e=this;this.timeout=Lt.request((function(){e.active&&t()}))}},{key:"inertiaTick",value:function(){var t,e,n,r,i,o,a,s=this,c=this.interaction,l=Fe(c).resistance,u=(c._now()-this.t0)/1e3;if(u<this.te){var p,f=1-(Math.exp(-l*u)-this.lambda_v0)/this.one_ve_v0;this.isModified?(t=0,e=0,n=this.targetOffset.x,r=this.targetOffset.y,i=this.modifiedOffset.x,o=this.modifiedOffset.y,p={x:Ye(a=f,t,n,i),y:Ye(a,e,r,o)}):p={x:this.targetOffset.x*f,y:this.targetOffset.y*f};var d={x:p.x-this.currentOffset.x,y:p.y-this.currentOffset.y};this.currentOffset.x+=d.x,this.currentOffset.y+=d.y,c.offsetBy(d),c.move(),this.onNextFrame((function(){return s.inertiaTick()}))}else c.offsetBy({x:this.modifiedOffset.x-this.currentOffset.x,y:this.modifiedOffset.y-this.currentOffset.y}),this.end()}},{key:"smoothEndTick",value:function(){var t=this,e=this.interaction,n=e._now()-this.t0,r=Fe(e).smoothEndDuration;if(n<r){var i={x:Le(n,0,this.targetOffset.x,r),y:Le(n,0,this.targetOffset.y,r)},o={x:i.x-this.currentOffset.x,y:i.y-this.currentOffset.y};this.currentOffset.x+=o.x,this.currentOffset.y+=o.y,e.offsetBy(o),e.move({skipModifiers:this.modifierCount}),this.onNextFrame((function(){return t.smoothEndTick()}))}else e.offsetBy({x:this.targetOffset.x-this.currentOffset.x,y:this.targetOffset.y-this.currentOffset.y}),this.end()}},{key:"resume",value:function(t){var e=t.pointer,n=t.event,r=t.eventTarget,i=this.interaction;i.offsetBy({x:-this.currentOffset.x,y:-this.currentOffset.y}),i.updatePointer(e,n,r,!0),i._doPhase({interaction:i,event:n,phase:"resume"}),et(i.coords.prev,i.coords.cur),this.stop()}},{key:"end",value:function(){this.interaction.move(),this.interaction.end(),this.stop()}},{key:"stop",value:function(){this.active=this.smoothEnd=!1,this.interaction.simulation=null,Lt.cancel(this.timeout)}}]),t}();/**
 * Gibt die Inertia-Option der vorbereiteten Aktion des Interactable zurück.
 * @param {Object} t - Objekt mit den Feldern `interactable` und `prepared`.
 * @param {Object} t.interactable - Das Interactable-Objekt, das Optionen enthält.
 * @param {Object} t.prepared - Die vorbereitete Aktionsbeschreibung mit einer `name`-Eigenschaft.
 * @returns {*} Der Wert der `inertia`-Option für die vorbereitete Aktion, oder `undefined`, wenn nicht gesetzt.
 */
function Fe(t){var e=t.interactable,n=t.prepared;return e&&e.options&&n.name&&e.options[n.name].inertia}var Xe={id:"inertia",before:["modifiers","actions"],install:function(t){var e=t.defaults;t.usePlugin(Ce),t.usePlugin(Ee),t.actions.phases.inertiastart=!0,t.actions.phases.resume=!0,e.perAction.inertia={enabled:!1,resistance:10,minSpeed:100,endSpeed:10,allowResume:!0,smoothEndDuration:300}},listeners:{"interactions:new":function(t){var e=t.interaction;e.inertia=new je(e)},"interactions:before-action-end":function(t){var e=t.interaction,n=t.event;return(!e._interacting||e.simulation||!e.inertia.start(n))&&null},"interactions:down":function(t){var e=t.interaction,n=t.eventTarget,r=e.inertia;if(r.active)for(var i=n;w.element(i);){if(i===e.element){r.resume(t);break}i=A(i)}},"interactions:stop":function(t){var e=t.interaction.inertia;e.active&&e.stop()},"interactions:before-action-resume":function(t){var e=t.interaction.modification;e.stop(t),e.start(t,t.interaction.coords.cur.page),e.applyToInteraction(t)},"interactions:before-action-inertiastart":function(t){return t.interaction.modification.setAndApply(t)},"interactions:action-resume":xe,"interactions:action-inertiastart":xe,"interactions:after-action-inertiastart":function(t){return t.interaction.modification.restoreInteractionCoords(t)},"interactions:after-action-resume":function(t){return t.interaction.modification.restoreInteractionCoords(t)}}};/**
 * Berechnet den Wert auf einer quadratischen Bézier-Kurve für einen gegebenen Parameter.
 * @param {number} t - Interpolationsparameter, üblicherweise zwischen 0 und 1.
 * @param {number} e - Startwert (z. B. x- oder y-Komponente des Startpunkts).
 * @param {number} n - Kontrollpunktwert (z. B. x- oder y-Komponente des Kontrollpunkts).
 * @param {number} r - Endwert (z. B. x- oder y-Komponente des Endpunkts).
 * @return {number} Interpolierter Wert auf der quadratischen Bézier-Kurve für den Parameter `t`.
 */
function Ye(t,e,n,r){var i=1-t;return i*i*e+2*i*t*n+t*t*r}/**
 * Berechnet den interpolierten Wert einer ease-out-Quadratkurve für einen Zeitpunkt.
 * @param {number} t - Aktuelle Zeit seit Beginn der Animation (0 <= t <= r).
 * @param {number} e - Startwert der Animation.
 * @param {number} n - Gesamte Änderung des Werts (Endwert minus Startwert).
 * @param {number} r - Gesamtdauer der Animation.
 * @returns {number} Der interpolierte Wert zur Zeit `t`.
 */
function Le(t,e,n,r){return-n*(t/=r)*(t-2)+e}var qe=Xe;/**
 * Ruft nacheinander Listener mit dem übergebenen Ereignis auf und beendet die Aufrufe, sobald die sofortige Propagation gestoppt wurde.
 *
 * @param {Object} t - Das Ereignisobjekt; die Eigenschaft `immediatePropagationStopped` beendet weitere Listener-Aufrufe, wenn sie `true` ist.
 * @param {Function[]} e - Array von Listener-Funktionen, die jeweils mit dem Ereignis aufgerufen werden.
 */
function Be(t,e){for(var n=0;n<e.length;n++){var r=e[n];if(t.immediatePropagationStopped)break;r(t)}}var Ve=function(){/**
 * Konstruiert einen Event-/Signal-Wrapper mit konfigurierbaren Optionen und initialen Propagationszuständen.
 * @constructor
 * @param {Object} [options] - Initiale Optionen; eine flache Kopie wird in der Instanz unter `options` abgelegt.
 */
function t(e){r(this,t),this.options=void 0,this.types={},this.propagationStopped=!1,this.immediatePropagationStopped=!1,this.global=void 0,this.options=V({},e||{})}return o(t,[{key:"fire",value:function(t){var e,n=this.global;(e=this.types[t.type])&&Be(t,e),!t.propagationStopped&&n&&(e=n[t.type])&&Be(t,e)}},{key:"on",value:function(t,e){var n=$(t,e);for(t in n)this.types[t]=gt(this.types[t]||[],n[t])}},{key:"off",value:function(t,e){var n=$(t,e);for(t in n){var r=this.types[t];if(r&&r.length)for(var i=0,o=n[t];i<o.length;i++){var a=o[i],s=r.indexOf(a);-1!==s&&r.splice(s,1)}}}},{key:"getRect",value:function(t){return null}}]),t}();var We=function(){/**
 * Erstellt eine InteractEvent-Instanz, die ein ursprüngliches DOM-Event kapselt und für das Interaktionssystem normalisierte Eigenschaften bereitstellt.
 * @param {Event} e - Das ursprüngliche native Event, das gekapselt wird.
 */
function t(e){r(this,t),this.currentTarget=void 0,this.originalEvent=void 0,this.type=void 0,this.originalEvent=e,tt(this,e)}return o(t,[{key:"preventOriginalDefault",value:function(){this.originalEvent.preventDefault()}},{key:"stopPropagation",value:function(){this.originalEvent.stopPropagation()}},{key:"stopImmediatePropagation",value:function(){this.originalEvent.stopImmediatePropagation()}}]),t}();/**
 * Normalisiert EventListener-Optionen zu einem Objekt mit den Feldern `capture` und `passive`.
 * @param {boolean|Object} t - Entweder ein Boolean, der nur `capture` angibt, oder ein Objekt mit optionalen `capture`- und `passive`-Eigenschaften.
 * @returns {{capture: boolean, passive: boolean}} Ein Objekt mit `capture` und `passive` als Booleans (`passive` ist `false`, wenn nur ein Boolean übergeben wurde).
 */
function Ge(t){return w.object(t)?{capture:!!t.capture,passive:!!t.passive}:{capture:!!t,passive:!1}}/**
 * Prüft, ob zwei Listener-Optionen oder -Flags als gleichwertig gelten.
 * 
 * Vergleicht entweder direkte Gleichheit oder — wenn das erste Argument ein boolean ist —
 * ob das zweite Argument ein Optionsobjekt mit entsprechendem `capture`- und `passive`-Wert repräsentiert.
 * 
 * @param {boolean|Object} t - Ein Boolean-Flag oder ein Listener-Optionsobjekt (z. B. `{ capture, passive }`).
 * @param {boolean|Object} e - Ein Boolean-Flag oder ein Listener-Optionsobjekt zum Vergleichen.
 * @returns {boolean} `true`, wenn die beiden Angaben als gleichwertig gelten, `false` sonst.
 */
function Ne(t,e){return t===e||("boolean"==typeof t?!!e.capture===t&&!1==!!e.passive:!!t.capture==!!e.capture&&!!t.passive==!!e.passive)}var Ue={id:"events",install:function(t){var e,n=[],r={},i=[],o={add:a,remove:s,addDelegate:function(t,e,n,o,s){var u=Ge(s);if(!r[n]){r[n]=[];for(var p=0;p<i.length;p++){var f=i[p];a(f,n,c),a(f,n,l,!0)}}var d=r[n],h=bt(d,(function(n){return n.selector===t&&n.context===e}));h||(h={selector:t,context:e,listeners:[]},d.push(h));h.listeners.push({func:o,options:u})},removeDelegate:function(t,e,n,i,o){var a,u=Ge(o),p=r[n],f=!1;if(!p)return;for(a=p.length-1;a>=0;a--){var d=p[a];if(d.selector===t&&d.context===e){for(var h=d.listeners,v=h.length-1;v>=0;v--){var g=h[v];if(g.func===i&&Ne(g.options,u)){h.splice(v,1),h.length||(p.splice(a,1),s(e,n,c),s(e,n,l,!0)),f=!0;break}}if(f)break}}},delegateListener:c,delegateUseCapture:l,delegatedEvents:r,documents:i,targets:n,supportsOptions:!1,supportsPassive:!1};/**
 * Fügt dem angegebenen Event-Target einen Event-Listener hinzu und verhindert Duplikate.
 *
 * Normalisiert die übergebenen Optionen, registriert den Listener in der internen Liste
 * und verwendet, falls unterstützt, die spezifizierten Options beim Aufruf von addEventListener.
 *
 * @param {EventTarget} t - Das Ziel, dem der Listener hinzugefügt werden soll.
 * @param {string} e - Der Event-Typ (z. B. "click").
 * @param {Function} r - Die Event-Handler-Funktion.
 * @param {Object|boolean} i - Die addEventListener-Optionen oder ein boolean für capture.
 */
function a(t,e,r,i){if(t.addEventListener){var a=Ge(i),s=bt(n,(function(e){return e.eventTarget===t}));s||(s={eventTarget:t,events:{}},n.push(s)),s.events[e]||(s.events[e]=[]),bt(s.events[e],(function(t){return t.func===r&&Ne(t.options,a)}))||(t.addEventListener(e,r,o.supportsOptions?a:a.capture),s.events[e].push({func:r,options:a}))}}/**
 * Entfernt zuvor registrierte DOM-Ereignis-Listener aus dem internen Registry und vom Event-Target.
 *
 * Entfernt entweder einen bestimmten Listener für einen Event-Typ, alle Listener für einen Typ
 * oder alle Listener aller Typen vom angegebenen Ziel; vergleicht Listener-Optionen beim Entfernen.
 * @param {EventTarget} t - Das Ziel, von dem der Listener entfernt werden soll.
 * @param {string} e - Der Event-Name (z. B. "click") oder `"all"` für alle Event-Typen.
 * @param {Function|string} r - Die Listener-Funktion, die entfernt werden soll, oder `"all"` für alle Listener des Typs.
 * @param {Object|boolean} [i] - Die Listener-Optionen (oder `capture`-Boolean) zum Abgleich beim Entfernen.
 */
function s(t,e,r,i){if(t.addEventListener&&t.removeEventListener){var a=yt(n,(function(e){return e.eventTarget===t})),c=n[a];if(c&&c.events)if("all"!==e){var l=!1,u=c.events[e];if(u){if("all"===r){for(var p=u.length-1;p>=0;p--){var f=u[p];s(t,e,f.func,f.options)}return}for(var d=Ge(i),h=0;h<u.length;h++){var v=u[h];if(v.func===r&&Ne(v.options,d)){t.removeEventListener(e,r,o.supportsOptions?d:d.capture),u.splice(h,1),0===u.length&&(delete c.events[e],l=!0);break}}}l&&!Object.keys(c.events).length&&n.splice(a,1)}else for(e in c.events)c.events.hasOwnProperty(e)&&s(t,e,"all")}}/**
 * Ruft für ein Interaktionsereignis alle passenden delegierten Listener auf und setzt dabei `currentTarget` auf das jeweilige Element.
 *
 * Führt die Callback-Funktionen der registrierten Listener aus, deren Selektor mit einem Vorfahren des Ereignisziels übereinstimmt, deren Kontext sowohl das ursprüngliche Ziel als auch das aktuelle Element erlaubt und deren Listener-Optionen mit dem übergebenen Event übereinstimmen.
 *
 * @param {Object} t - Das normalisierte Interaktionsereignis (z. B. InteractEvent), das Informationen über Typ und Ziel enthält.
 * @param {Event|Object} e - Das ursprüngliche DOM-Event oder ein Objekt mit Options/Metadaten, das zur Filterung der Listener herangezogen wird.
 */
function c(t,e){for(var n=Ge(e),i=new We(t),o=r[t.type],a=ht(t)[0],s=a;w.element(s);){for(var c=0;c<o.length;c++){var l=o[c],u=l.selector,p=l.context;if(R(s,u)&&M(p,a)&&M(p,s)){var f=l.listeners;i.currentTarget=s;for(var d=0;d<f.length;d++){var h=f[d];Ne(h.options,n)&&h.func(i)}}}s=A(s)}}function l(t){return c(t,!0)}return null==(e=t.document)||e.createElement("div").addEventListener("test",null,{get capture(){return o.supportsOptions=!0},get passive(){return o.supportsPassive=!0}}),t.events=o,o}},He={methodOrder:["simulationResume","mouseOrPen","hasPointer","idle"],search:function(t){for(var e=0,n=He.methodOrder;e<n.length;e++){var r=n[e],i=He[r](t);if(i)return i}return null},simulationResume:function(t){var e=t.pointerType,n=t.eventType,r=t.eventTarget,i=t.scope;if(!/down|start/i.test(n))return null;for(var o=0,a=i.interactions.list;o<a.length;o++){var s=a[o],c=r;if(s.simulation&&s.simulation.allowResume&&s.pointerType===e)for(;c;){if(c===s.element)return s;c=A(c)}}return null},mouseOrPen:function(t){var e,n=t.pointerId,r=t.pointerType,i=t.eventType,o=t.scope;if("mouse"!==r&&"pen"!==r)return null;for(var a=0,s=o.interactions.list;a<s.length;a++){var c=s[a];if(c.pointerType===r){if(c.simulation&&!Ke(c,n))continue;if(c.interacting())return c;e||(e=c)}}if(e)return e;for(var l=0,u=o.interactions.list;l<u.length;l++){var p=u[l];if(!(p.pointerType!==r||/down/i.test(i)&&p.simulation))return p}return null},hasPointer:function(t){for(var e=t.pointerId,n=0,r=t.scope.interactions.list;n<r.length;n++){var i=r[n];if(Ke(i,e))return i}return null},idle:function(t){for(var e=t.pointerType,n=0,r=t.scope.interactions.list;n<r.length;n++){var i=r[n];if(1===i.pointers.length){var o=i.interactable;if(o&&(!o.options.gesture||!o.options.gesture.enabled))continue}else if(i.pointers.length>=2)continue;if(!i.interacting()&&e===i.pointerType)return i}return null}};/**
 * Prüft, ob ein Zeiger mit der angegebenen ID in der Interaktion vorhanden ist.
 * @param {Object} t - Interaktionsobjekt mit einem Array `pointers`, in dem jeder Zeiger ein `id`-Feld hat.
 * @param {number|string} e - Die ID des gesuchten Zeigers.
 * @returns {boolean} `true`, wenn ein Zeiger mit der angegebenen ID existiert, `false` sonst.
 */
function Ke(t,e){return t.pointers.some((function(t){return t.id===e}))}var $e=He,Je=["pointerDown","pointerMove","pointerUp","updatePointer","removePointer","windowBlur"];/**
 * Erzeugt einen Ereignis-Handler, der native Touch/Pointer/Mouse-Ereignisse in Pointer-Einträge umwandelt und die angegebene Aktion auf betroffene Interaktionen anwendet.
 *
 * Wandelt das eingehende Event in ein oder mehrere Pointer-Record(s) um (unterstützt Touch-Multi-Touch und Einzelpointer-Fälle), ermittelt für jeden Pointer die zugehörigen Interaktionen im übergebenen Scope und ruft die Methode mit dem Namen `actionName` auf diesen Interaktionen auf.
 *
 * @param {string} actionName - Der Name der Methode, die auf den ermittelten Interaktionen aufgerufen werden soll (z. B. "start", "move", "end").
 * @param {object} scope - Das InteractJS-Scope-Objekt, das die aktive Interaktionenliste und Kontextinformationen enthält.
 * @returns {function(Event):void} Ein Event-Handler, der ein DOM-Ereignis entgegennimmt, die Pointer extrahiert und die Aktion auf die gefundenen Interaktionen ausführt.
 */
function Qe(t,e){return function(n){var r=e.interactions.list,i=dt(n),o=ht(n),a=o[0],s=o[1],c=[];if(/^touch/.test(n.type)){e.prevTouchTime=e.now();for(var l=0,u=n.changedTouches;l<u.length;l++){var p=u[l],f={pointer:p,pointerId:at(p),pointerType:i,eventType:n.type,eventTarget:a,curEventTarget:s,scope:e},d=Ze(f);c.push([f.pointer,f.eventTarget,f.curEventTarget,d])}}else{var h=!1;if(!I.supportsPointerEvent&&/mouse/.test(n.type)){for(var v=0;v<r.length&&!h;v++)h="mouse"!==r[v].pointerType&&r[v].pointerIsDown;h=h||e.now()-e.prevTouchTime<500||0===n.timeStamp}if(!h){var g={pointer:n,pointerId:at(n),pointerType:i,eventType:n.type,curEventTarget:s,eventTarget:a,scope:e},m=Ze(g);c.push([g.pointer,g.eventTarget,g.curEventTarget,m])}}for(var y=0;y<c.length;y++){var b=c[y],x=b[0],w=b[1],E=b[2];b[3][t](x,n,w,E)}}}/**
 * Findet die Interaction, die zu den übergebenen Suchparametern passt, oder erstellt eine neue.
 *
 * @param {Object} t - Suchkontext mit Feldern zur Interaktionssuche.
 * @param {string} t.pointerType - Typ des Zeigers (z. B. 'mouse', 'touch', 'pen').
 * @param {Object} t.scope - Scope-Objekt, in dem nach Interactions gesucht und Events gefeuert werden.
 * @returns {Interaction} Das gefundene Interaction-Objekt oder ein neu erzeugtes Interaction. 
 */
function Ze(t){var e=t.pointerType,n=t.scope,r={interaction:$e.search(t),searchDetails:t};return n.fire("interactions:find",r),r.interaction||n.interactions.new({pointerType:e})}/**
 * Registriert dokumentweite Event-Listener für den gegebenen Scope und die Interaktionen.
 *
 * Fügt delegierte Event-Listener (aus `scope.events.delegatedEvents`) auf `t.doc` hinzu und registriert
 * außerdem alle Listener aus `scope.interactions.docEvents`. Bei iOS wird, falls noch keine
 * `options.events` vorhanden sind, `options.events = { passive: false }` gesetzt, bevor Listener mit
 * den gegebenen Listener-Optionen registriert werden.
 *
 * @param {Object} t - Kontextobjekt mit den folgenden Feldern:
 *   - {Document} doc: Das Document-Objekt, auf dem die Listener registriert werden.
 *   - {Object} scope: Die Scope-Instanz mit `events`, `browser` und `interactions`.
 *   - {Object} [options]: Interactable-/Instanzoptionen, optional `events`-Einstellungen.
 * @param {string} e - Der Schlüsselname des Event-Registrar-Helpers in `scope.events` (z. B. 'on'/'off').
 */
function tn(t,e){var n=t.doc,r=t.scope,i=t.options,o=r.interactions.docEvents,a=r.events,s=a[e];for(var c in r.browser.isIOS&&!i.events&&(i.events={passive:!1}),a.delegatedEvents)s(n,c,a.delegateListener),s(n,c,a.delegateUseCapture,!0);for(var l=i&&i.events,u=0;u<o.length;u++){var p=o[u];s(n,p.type,p.listener,l)}}var en={id:"core/interactions",install:function(t){for(var e={},n=0;n<Je.length;n++){var i=Je[n];e[i]=Qe(i,t)}var a,c=I.pEventTypes;/**
 * Entfernt verwaiste Touch-Pointer aus nicht-interagierenden Interaktionen.
 *
 * Durchsucht alle Interaktionen und entfernt Pointer, deren ursprüngliches
 * downTarget nicht mehr in den bekannten Dokumenten vorhanden ist, für
 * Interaktionen mit pointerIsDown und pointerType "touch", die aktuell nicht
 * im Interagieren-Zustand sind.
 */
function l(){for(var e=0,n=t.interactions.list;e<n.length;e++){var r=n[e];if(r.pointerIsDown&&"touch"===r.pointerType&&!r._interacting)for(var i=function(){var e=a[o];t.documents.some((function(t){return M(t.doc,e.downTarget)}))||r.removePointer(e.pointer,e.event)},o=0,a=r.pointers;o<a.length;o++)i()}}(a=k.PointerEvent?[{type:c.down,listener:l},{type:c.down,listener:e.pointerDown},{type:c.move,listener:e.pointerMove},{type:c.up,listener:e.pointerUp},{type:c.cancel,listener:e.pointerUp}]:[{type:"mousedown",listener:e.pointerDown},{type:"mousemove",listener:e.pointerMove},{type:"mouseup",listener:e.pointerUp},{type:"touchstart",listener:l},{type:"touchstart",listener:e.pointerDown},{type:"touchmove",listener:e.pointerMove},{type:"touchend",listener:e.pointerUp},{type:"touchcancel",listener:e.pointerUp}]).push({type:"blur",listener:function(e){for(var n=0,r=t.interactions.list;n<r.length;n++){r[n].documentBlur(e)}}}),t.prevTouchTime=0,t.Interaction=function(e){s(i,e);var n=p(i);/**
 * Leitet den Aufruf mit allen übergebenen Argumenten und dem aktuellen Kontext (`this`) weiter.
 * 
 * @returns {any} Der Rückgabewert der weitergeleiteten Funktion.
 */
function i(){return r(this,i),n.apply(this,arguments)}return o(i,[{key:"pointerMoveTolerance",get:function(){return t.interactions.pointerMoveTolerance},set:function(e){t.interactions.pointerMoveTolerance=e}},{key:"_now",value:function(){return t.now()}}]),i}(De),t.interactions={list:[],new:function(e){e.scopeFire=function(e,n){return t.fire(e,n)};var n=new t.Interaction(e);return t.interactions.list.push(n),n},listeners:e,docEvents:a,pointerMoveTolerance:1},t.usePlugin(he)},listeners:{"scope:add-document":function(t){return tn(t,"add")},"scope:remove-document":function(t){return tn(t,"remove")},"interactable:unset":function(t,e){for(var n=t.interactable,r=e.interactions.list.length-1;r>=0;r--){var i=e.interactions.list[r];i.interactable===n&&(i.stop(),e.fire("interactions:destroy",{interaction:i}),i.destroy(),e.interactions.list.length>2&&e.interactions.list.splice(r,1))}}},onDocSignal:tn,doOnInteractions:Qe,methodNames:Je},nn=en,rn=function(t){return t[t.On=0]="On",t[t.Off=1]="Off",t}(rn||{}),on=function(){/**
 * Erstellt eine neue Interactable-Instanz für ein Ziel-Element oder einen Selektor.
 *
 * Initialisiert interne Zustände (Optionen, Aktionen, Event-Bus, Kontext-, Fenster- und Dokumentverweise)
 * und wendet die übergebenen Optionen an.
 *
 * @param {Element|string} e - Das Ziel dieser Interactable-Instanz; entweder ein DOM-Element oder ein Selektor-String.
 * @param {Object} n - Konfigurationsobjekt mit Optionen und Aktionsdefinitionen (z. B. `actions`, `context`).
 * @param {Document|Element} [i] - Optionaler Kontext, in dem das Ziel aufgelöst wird; falls nicht angegeben, wird `n.context` oder das Ziel selbst verwendet.
 * @param {Object} [o] - Scope-weite Event-Handler oder Event-Dispatcher, die von der Instanz genutzt werden.
 */
function t(e,n,i,o){r(this,t),this.target=void 0,this.options=void 0,this._actions=void 0,this.events=new Ve,this._context=void 0,this._win=void 0,this._doc=void 0,this._scopeEvents=void 0,this._actions=n.actions,this.target=e,this._context=n.context||i,this._win=y(B(e)?this._context:e),this._doc=this._win.document,this._scopeEvents=o,this.set(n)}return o(t,[{key:"_defaults",get:function(){return{base:{},perAction:{},actions:{}}}},{key:"setOnEvents",value:function(t,e){return w.func(e.onstart)&&this.on("".concat(t,"start"),e.onstart),w.func(e.onmove)&&this.on("".concat(t,"move"),e.onmove),w.func(e.onend)&&this.on("".concat(t,"end"),e.onend),w.func(e.oninertiastart)&&this.on("".concat(t,"inertiastart"),e.oninertiastart),this}},{key:"updatePerActionListeners",value:function(t,e,n){var r,i=this,o=null==(r=this._actions.map[t])?void 0:r.filterEventType,a=function(t){return(null==o||o(t))&&ve(t,i._actions)};(w.array(e)||w.object(e))&&this._onOff(rn.Off,t,e,void 0,a),(w.array(n)||w.object(n))&&this._onOff(rn.On,t,n,void 0,a)}},{key:"setPerAction",value:function(t,e){var n=this._defaults;for(var r in e){var i=r,o=this.options[t],a=e[i];"listeners"===i&&this.updatePerActionListeners(t,o.listeners,a),w.array(a)?o[i]=mt(a):w.plainObject(a)?(o[i]=V(o[i]||{},ge(a)),w.object(n.perAction[i])&&"enabled"in n.perAction[i]&&(o[i].enabled=!1!==a.enabled)):w.bool(a)&&w.object(n.perAction[i])?o[i].enabled=a:o[i]=a}}},{key:"getRect",value:function(t){return t=t||(w.element(this.target)?this.target:null),w.string(this.target)&&(t=t||this._context.querySelector(this.target)),L(t)}},{key:"rectChecker",value:function(t){var e=this;return w.func(t)?(this.getRect=function(n){var r=V({},t.apply(e,n));return"width"in r||(r.width=r.right-r.left,r.height=r.bottom-r.top),r},this):null===t?(delete this.getRect,this):this.getRect}},{key:"_backCompatOption",value:function(t,e){if(B(e)||w.object(e)){for(var n in this.options[t]=e,this._actions.map)this.options[n][t]=e;return this}return this.options[t]}},{key:"origin",value:function(t){return this._backCompatOption("origin",t)}},{key:"deltaSource",value:function(t){return"page"===t||"client"===t?(this.options.deltaSource=t,this):this.options.deltaSource}},{key:"getAllElements",value:function(){var t=this.target;return w.string(t)?Array.from(this._context.querySelectorAll(t)):w.func(t)&&t.getAllElements?t.getAllElements():w.element(t)?[t]:[]}},{key:"context",value:function(){return this._context}},{key:"inContext",value:function(t){return this._context===t.ownerDocument||M(this._context,t)}},{key:"testIgnoreAllow",value:function(t,e,n){return!this.testIgnore(t.ignoreFrom,e,n)&&this.testAllow(t.allowFrom,e,n)}},{key:"testAllow",value:function(t,e,n){return!t||!!w.element(n)&&(w.string(t)?F(n,t,e):!!w.element(t)&&M(t,n))}},{key:"testIgnore",value:function(t,e,n){return!(!t||!w.element(n))&&(w.string(t)?F(n,t,e):!!w.element(t)&&M(t,n))}},{key:"fire",value:function(t){return this.events.fire(t),this}},{key:"_onOff",value:function(t,e,n,r,i){w.object(e)&&!w.array(e)&&(r=n,n=null);var o=$(e,n,i);for(var a in o){"wheel"===a&&(a=I.wheelEvent);for(var s=0,c=o[a];s<c.length;s++){var l=c[s];ve(a,this._actions)?this.events[t===rn.On?"on":"off"](a,l):w.string(this.target)?this._scopeEvents[t===rn.On?"addDelegate":"removeDelegate"](this.target,this._context,a,l,r):this._scopeEvents[t===rn.On?"add":"remove"](this.target,a,l,r)}}return this}},{key:"on",value:function(t,e,n){return this._onOff(rn.On,t,e,n)}},{key:"off",value:function(t,e,n){return this._onOff(rn.Off,t,e,n)}},{key:"set",value:function(t){var e=this._defaults;for(var n in w.object(t)||(t={}),this.options=ge(e.base),this._actions.methodDict){var r=n,i=this._actions.methodDict[r];this.options[r]={},this.setPerAction(r,V(V({},e.perAction),e.actions[r])),this[i](t[r])}for(var o in t)"getRect"!==o?w.func(this[o])&&this[o](t[o]):this.rectChecker(t.getRect);return this}},{key:"unset",value:function(){if(w.string(this.target))for(var t in this._scopeEvents.delegatedEvents)for(var e=this._scopeEvents.delegatedEvents[t],n=e.length-1;n>=0;n--){var r=e[n],i=r.selector,o=r.context,a=r.listeners;i===this.target&&o===this._context&&e.splice(n,1);for(var s=a.length-1;s>=0;s--)this._scopeEvents.removeDelegate(this.target,this._context,t,a[s][0],a[s][1])}else this._scopeEvents.remove(this.target,"all")}}]),t}(),an=function(){/**
 * Verwalten einer Sammlung von Interactable-Objekten für eine gegebene Scope-Instanz und automatisches Entfernen von Interactables beim Empfang des `interactable:unset`-Ereignisses.
 * @param {Object} scope - Die Scope-Instanz, in deren Kontext die Interactables verwaltet werden.
 * @constructor
 */
function t(e){var n=this;r(this,t),this.list=[],this.selectorMap={},this.scope=void 0,this.scope=e,e.addListeners({"interactable:unset":function(t){var e=t.interactable,r=e.target,i=w.string(r)?n.selectorMap[r]:r[n.scope.id],o=yt(i,(function(t){return t===e}));i.splice(o,1)}})}return o(t,[{key:"new",value:function(t,e){e=V(e||{},{actions:this.scope.actions});var n=new this.scope.Interactable(t,e,this.scope.document,this.scope.events);return this.scope.addDocument(n._doc),this.list.push(n),w.string(t)?(this.selectorMap[t]||(this.selectorMap[t]=[]),this.selectorMap[t].push(n)):(n.target[this.scope.id]||Object.defineProperty(t,this.scope.id,{value:[],configurable:!0}),t[this.scope.id].push(n)),this.scope.fire("interactable:new",{target:t,options:e,interactable:n,win:this.scope._win}),n}},{key:"getExisting",value:function(t,e){var n=e&&e.context||this.scope.document,r=w.string(t),i=r?this.selectorMap[t]:t[this.scope.id];if(i)return bt(i,(function(e){return e._context===n&&(r||e.inContext(t))}))}},{key:"forEachMatch",value:function(t,e){for(var n=0,r=this.list;n<r.length;n++){var i=r[n],o=void 0;if((w.string(i.target)?w.element(t)&&R(t,i.target):t===i.target)&&i.inContext(t)&&(o=e(i)),void 0!==o)return o}}}]),t}();var sn=function(){/**
 * Erzeugt ein neues Interact.js Scope‑Objekt, das zentrale Bibliothekszustände, Aktionen,
 * Interactables, Events und das Plugin‑/Dokument‑Management kapselt.
 *
 * Das Scope verwaltet Browser-/Dokumentkontexte, Standardoptionen, registrierte Aktionen,
 * die Sammlung von Interactables, aktive Interaktionen sowie das Plugin- und Eventsystem.
 *
 * @constructor
 * @public
 */
function t(){var e=this;r(this,t),this.id="__interact_scope_".concat(Math.floor(100*Math.random())),this.isInitialized=!1,this.listenerMaps=[],this.browser=I,this.defaults=ge(Te),this.Eventable=Ve,this.actions={map:{},phases:{start:!0,move:!0,end:!0},methodDict:{},phaselessTypes:{}},this.interactStatic=function(t){var e=function e(n,r){var i=t.interactables.getExisting(n,r);return i||((i=t.interactables.new(n,r)).events.global=e.globalEvents),i};return e.getPointerAverage=lt,e.getTouchBBox=ut,e.getTouchDistance=pt,e.getTouchAngle=ft,e.getElementRect=L,e.getElementClientRect=Y,e.matchesSelector=R,e.closest=z,e.globalEvents={},e.version="1.10.27",e.scope=t,e.use=function(t,e){return this.scope.usePlugin(t,e),this},e.isSet=function(t,e){return!!this.scope.interactables.get(t,e&&e.context)},e.on=Nt((function(t,e,n){if(w.string(t)&&-1!==t.search(" ")&&(t=t.trim().split(/ +/)),w.array(t)){for(var r=0,i=t;r<i.length;r++){var o=i[r];this.on(o,e,n)}return this}if(w.object(t)){for(var a in t)this.on(a,t[a],e);return this}return ve(t,this.scope.actions)?this.globalEvents[t]?this.globalEvents[t].push(e):this.globalEvents[t]=[e]:this.scope.events.add(this.scope.document,t,e,{options:n}),this}),"The interact.on() method is being deprecated"),e.off=Nt((function(t,e,n){if(w.string(t)&&-1!==t.search(" ")&&(t=t.trim().split(/ +/)),w.array(t)){for(var r=0,i=t;r<i.length;r++){var o=i[r];this.off(o,e,n)}return this}if(w.object(t)){for(var a in t)this.off(a,t[a],e);return this}var s;return ve(t,this.scope.actions)?t in this.globalEvents&&-1!==(s=this.globalEvents[t].indexOf(e))&&this.globalEvents[t].splice(s,1):this.scope.events.remove(this.scope.document,t,e,n),this}),"The interact.off() method is being deprecated"),e.debug=function(){return this.scope},e.supportsTouch=function(){return I.supportsTouch},e.supportsPointerEvent=function(){return I.supportsPointerEvent},e.stop=function(){for(var t=0,e=this.scope.interactions.list;t<e.length;t++)e[t].stop();return this},e.pointerMoveTolerance=function(t){return w.number(t)?(this.scope.interactions.pointerMoveTolerance=t,this):this.scope.interactions.pointerMoveTolerance},e.addDocument=function(t,e){this.scope.addDocument(t,e)},e.removeDocument=function(t){this.scope.removeDocument(t)},e}(this),this.InteractEvent=Se,this.Interactable=void 0,this.interactables=new an(this),this._win=void 0,this.document=void 0,this.window=void 0,this.documents=[],this._plugins={list:[],map:{}},this.onWindowUnload=function(t){return e.removeDocument(t.target)};var n=this;this.Interactable=function(t){s(i,t);var e=p(i);function i(){return r(this,i),e.apply(this,arguments)}return o(i,[{key:"_defaults",get:function(){return n.defaults}},{key:"set",value:function(t){return f(c(i.prototype),"set",this).call(this,t),n.fire("interactable:set",{options:t,interactable:this}),this}},{key:"unset",value:function(){f(c(i.prototype),"unset",this).call(this);var t=n.interactables.list.indexOf(this);t<0||(n.interactables.list.splice(t,1),n.fire("interactable:unset",{interactable:this}))}}]),i}(on)}return o(t,[{key:"addListeners",value:function(t,e){this.listenerMaps.push({id:e,map:t})}},{key:"fire",value:function(t,e){for(var n=0,r=this.listenerMaps;n<r.length;n++){var i=r[n].map[t];if(i&&!1===i(e,this,t))return!1}}},{key:"init",value:function(t){return this.isInitialized?this:function(t,e){t.isInitialized=!0,w.window(e)&&m(e);return k.init(e),I.init(e),Lt.init(e),t.window=e,t.document=e.document,t.usePlugin(nn),t.usePlugin(Ue),t}(this,t)}},{key:"pluginIsInstalled",value:function(t){var e=t.id;return e?!!this._plugins.map[e]:-1!==this._plugins.list.indexOf(t)}},{key:"usePlugin",value:function(t,e){if(!this.isInitialized)return this;if(this.pluginIsInstalled(t))return this;if(t.id&&(this._plugins.map[t.id]=t),this._plugins.list.push(t),t.install&&t.install(this,e),t.listeners&&t.before){for(var n=0,r=this.listenerMaps.length,i=t.before.reduce((function(t,e){return t[e]=!0,t[cn(e)]=!0,t}),{});n<r;n++){var o=this.listenerMaps[n].id;if(o&&(i[o]||i[cn(o)]))break}this.listenerMaps.splice(n,0,{id:t.id,map:t.listeners})}else t.listeners&&this.listenerMaps.push({id:t.id,map:t.listeners});return this}},{key:"addDocument",value:function(t,e){if(-1!==this.getDocIndex(t))return!1;var n=y(t);e=e?V({},e):{},this.documents.push({doc:t,options:e}),this.events.documents.push(t),t!==this.document&&this.events.add(n,"unload",this.onWindowUnload),this.fire("scope:add-document",{doc:t,window:n,scope:this,options:e})}},{key:"removeDocument",value:function(t){var e=this.getDocIndex(t),n=y(t),r=this.documents[e].options;this.events.remove(n,"unload",this.onWindowUnload),this.documents.splice(e,1),this.events.documents.splice(e,1),this.fire("scope:remove-document",{doc:t,window:n,scope:this,options:r})}},{key:"getDocIndex",value:function(t){for(var e=0;e<this.documents.length;e++)if(this.documents[e].doc===t)return e;return-1}},{key:"getDocOptions",value:function(t){var e=this.getDocIndex(t);return-1===e?null:this.documents[e].options}},{key:"now",value:function(){return(this.window.Date||Date).now()}}]),t}();/**
 * Gibt den Teil eines Strings vor dem ersten Schrägstrich zurück.
 * @param {string} t - Der Eingabestring oder ein falsy-Wert (z. B. null/undefined/'').
 * @returns {string|*} Den Teil des Strings vor dem ersten '/'-Zeichen, oder den unveränderten Eingabewert, wenn kein String übergeben wurde.
 */
function cn(t){return t&&t.replace(/\/.*$/,"")}var ln=new sn,un=ln.interactStatic,pn="undefined"!=typeof globalThis?globalThis:window;ln.init(pn);var fn=Object.freeze({__proto__:null,edgeTarget:function(){},elements:function(){},grid:function(t){var e=[["x","y"],["left","top"],["right","bottom"],["width","height"]].filter((function(e){var n=e[0],r=e[1];return n in t||r in t})),n=function(n,r){for(var i=t.range,o=t.limits,a=void 0===o?{left:-1/0,right:1/0,top:-1/0,bottom:1/0}:o,s=t.offset,c=void 0===s?{x:0,y:0}:s,l={range:i,grid:t,x:null,y:null},u=0;u<e.length;u++){var p=e[u],f=p[0],d=p[1],h=Math.round((n-c.x)/t[f]),v=Math.round((r-c.y)/t[d]);l[f]=Math.max(a.left,Math.min(a.right,h*t[f]+c.x)),l[d]=Math.max(a.top,Math.min(a.bottom,v*t[d]+c.y))}return l};return n.grid=t,n.coordFields=e,n}}),dn={id:"snappers",install:function(t){var e=t.interactStatic;e.snappers=V(e.snappers||{},fn),e.createSnapGrid=e.snappers.grid}},hn=dn,vn={start:function(t){var n=t.state,r=t.rect,i=t.edges,o=t.pageCoords,a=n.options,s=a.ratio,c=a.enabled,l=n.options,u=l.equalDelta,p=l.modifiers;"preserve"===s&&(s=r.width/r.height),n.startCoords=V({},o),n.startRect=V({},r),n.ratio=s,n.equalDelta=u;var f=n.linkedEdges={top:i.top||i.left&&!i.bottom,left:i.left||i.top&&!i.right,bottom:i.bottom||i.right&&!i.top,right:i.right||i.bottom&&!i.left};if(n.xIsPrimaryAxis=!(!i.left&&!i.right),n.equalDelta){var d=(f.left?1:-1)*(f.top?1:-1);n.edgeSign={x:d,y:d}}else n.edgeSign={x:f.left?-1:1,y:f.top?-1:1};if(!1!==c&&V(i,f),null!=p&&p.length){var h=new me(t.interaction);h.copyFrom(t.interaction.modification),h.prepareStates(p),n.subModification=h,h.startAll(e({},t))}},set:function(t){var n=t.state,r=t.rect,i=t.coords,o=n.linkedEdges,a=V({},i),s=n.equalDelta?gn:mn;if(V(t.edges,o),s(n,n.xIsPrimaryAxis,i,r),!n.subModification)return null;var c=V({},r);H(o,c,{x:i.x-a.x,y:i.y-a.y});var l=n.subModification.setAll(e(e({},t),{},{rect:c,edges:o,pageCoords:i,prevCoords:i,prevRect:c})),u=l.delta;l.changed&&(s(n,Math.abs(u.x)>Math.abs(u.y),l.coords,l.rect),V(i,l.coords));return l.eventProps},defaults:{ratio:"preserve",equalDelta:!1,modifiers:[],enabled:!1}};/**
 * Setzt die fehlende Komponente von n so, dass der Punkt auf der durch t.startCoords und t.edgeSign bestimmten Kante liegt.
 *
 * Berechnet entweder n.y aus n.x oder n.x aus n.y und den im Objekt t enthaltenen Werten.
 * @param {Object} t - Objekt mit den Eigenschaften `startCoords` ({x, y}) und `edgeSign` ({x, y}) zur Kantenbeschreibung.
 * @param {boolean} e - Wenn `true`, wird `n.y` anhand von `n.x` berechnet; sonst wird `n.x` anhand von `n.y` berechnet.
 * @param {Object} n - Punktobjekt mit numerischen `x`- und `y`-Eigenschaften; die eine Komponente wird verändert.
 */
function gn(t,e,n){var r=t.startCoords,i=t.edgeSign;e?n.y=r.y+(n.x-r.x)*i.y:n.x=r.x+(n.y-r.y)*i.x}/**
 * Aktualisiert die x- oder y-Koordinate so, dass das Seitenverhältnis während einer Größenänderung erhalten bleibt.
 * @param {Object} t - Statusobjekt mit folgenden Eigenschaften: `startRect` (Ausgangs-Rect), `startCoords` (Ausgangskoordinaten), `ratio` (Seitenverhältnis) und `edgeSign` (Richtungssignale für Kanten).
 * @param {boolean} e - `true`, wenn die Breitenänderung die y-Koordinate beeinflusst; `false`, wenn die Höhenänderung die x-Koordinate beeinflusst.
 * @param {Object} n - Zu aktualisierendes Koordinatenobjekt mit `x` und `y`.
 * @param {Object} r - Aktuelles Rect mit `width` und `height`.
 */
function mn(t,e,n,r){var i=t.startRect,o=t.startCoords,a=t.ratio,s=t.edgeSign;if(e){var c=r.width/a;n.y=o.y+(c-i.height)*s.y}else{var l=r.height*a;n.x=o.x+(l-i.width)*s.x}}var yn=be(vn,"aspectRatio"),bn=function(){};bn._defaults={};var xn=bn;/**
 * Löst `t` über die Hilfsfunktion `G` auf; wenn `t` eine Funktion ist, wird sie mit den Koordinaten aus `n` und dem Kontext `e` aufgerufen.
 * @param {*} t - Ein direkter Wert oder eine Funktion, die aufgelöst werden soll.
 * @param {{interactable: *, element: *}} e - Kontextobjekt mit `interactable` und `element`.
 * @param {{x: number, y: number}} n - Objekt mit `x`- und `y`-Koordinaten, das als Argument übergeben wird, falls `t` eine Funktion ist.
 * @returns {*} Das von `G` zurückgegebene Ergebnis der Auflösung von `t`.
 */
function wn(t,e,n){return w.func(t)?G(t,e.interactable,e.element,[n.x,n.y,e]):G(t,e.interactable,e.element)}var En={start:function(t){var e=t.rect,n=t.startOffset,r=t.state,i=t.interaction,o=t.pageCoords,a=r.options,s=a.elementRect,c=V({left:0,top:0,right:0,bottom:0},a.offset||{});if(e&&s){var l=wn(a.restriction,i,o);if(l){var u=l.right-l.left-e.width,p=l.bottom-l.top-e.height;u<0&&(c.left+=u,c.right+=u),p<0&&(c.top+=p,c.bottom+=p)}c.left+=n.left-e.width*s.left,c.top+=n.top-e.height*s.top,c.right+=n.right-e.width*(1-s.right),c.bottom+=n.bottom-e.height*(1-s.bottom)}r.offset=c},set:function(t){var e=t.coords,n=t.interaction,r=t.state,i=r.options,o=r.offset,a=wn(i.restriction,n,e);if(a){var s=function(t){return!t||"left"in t&&"top"in t||((t=V({},t)).left=t.x||0,t.top=t.y||0,t.right=t.right||t.left+t.width,t.bottom=t.bottom||t.top+t.height),t}(a);e.x=Math.max(Math.min(s.right-o.right,e.x),s.left+o.left),e.y=Math.max(Math.min(s.bottom-o.bottom,e.y),s.top+o.top)}},defaults:{restriction:null,elementRect:null,offset:null,endOnly:!1,enabled:!1}},Tn=be(En,"restrict"),Sn={top:1/0,left:1/0,bottom:-1/0,right:-1/0},_n={top:-1/0,left:-1/0,bottom:1/0,right:1/0};/**
 * Füllt fehlende Kantenwerte (top, left, bottom, right) in einem Zielobjekt aus einem Quellobjekt.
 * @param {Object} t - Zielobjekt, dem die fehlenden Kanten-Eigenschaften hinzugefügt werden.
 * @param {Object} e - Quellobjekt, von dem die Ersatzwerte für fehlende Kanten-Eigenschaften stammen.
 * @returns {Object} Das Zielobjekt `t` mit den gesetzten `top`, `left`, `bottom` und `right`-Werten.
 */
function Pn(t,e){for(var n=0,r=["top","left","bottom","right"];n<r.length;n++){var i=r[n];i in t||(t[i]=e[i])}return t}var On={noInner:Sn,noOuter:_n,start:function(t){var e,n=t.interaction,r=t.startOffset,i=t.state,o=i.options;o&&(e=N(wn(o.offset,n,n.coords.start.page))),e=e||{x:0,y:0},i.offset={top:e.y+r.top,left:e.x+r.left,bottom:e.y-r.bottom,right:e.x-r.right}},set:function(t){var e=t.coords,n=t.edges,r=t.interaction,i=t.state,o=i.offset,a=i.options;if(n){var s=V({},e),c=wn(a.inner,r,s)||{},l=wn(a.outer,r,s)||{};Pn(c,Sn),Pn(l,_n),n.top?e.y=Math.min(Math.max(l.top+o.top,s.y),c.top+o.top):n.bottom&&(e.y=Math.max(Math.min(l.bottom+o.bottom,s.y),c.bottom+o.bottom)),n.left?e.x=Math.min(Math.max(l.left+o.left,s.x),c.left+o.left):n.right&&(e.x=Math.max(Math.min(l.right+o.right,s.x),c.right+o.right))}},defaults:{inner:null,outer:null,offset:null,endOnly:!1,enabled:!1}},kn=be(On,"restrictEdges"),Dn=V({get elementRect(){return{top:0,left:0,bottom:1,right:1}},set elementRect(t){}},En.defaults),In=be({start:En.start,set:En.set,defaults:Dn},"restrictRect"),Mn={width:-1/0,height:-1/0},zn={width:1/0,height:1/0};var An=be({start:function(t){return On.start(t)},set:function(t){var e=t.interaction,n=t.state,r=t.rect,i=t.edges,o=n.options;if(i){var a=U(wn(o.min,e,t.coords))||Mn,s=U(wn(o.max,e,t.coords))||zn;n.options={endOnly:o.endOnly,inner:V({},On.noInner),outer:V({},On.noOuter)},i.top?(n.options.inner.top=r.bottom-a.height,n.options.outer.top=r.bottom-s.height):i.bottom&&(n.options.inner.bottom=r.top+a.height,n.options.outer.bottom=r.top+s.height),i.left?(n.options.inner.left=r.right-a.width,n.options.outer.left=r.right-s.width):i.right&&(n.options.inner.right=r.left+a.width,n.options.outer.right=r.left+s.width),On.set(t),n.options=o}},defaults:{min:null,max:null,endOnly:!1,enabled:!1}},"restrictSize");var Rn={start:function(t){var e,n=t.interaction,r=t.interactable,i=t.element,o=t.rect,a=t.state,s=t.startOffset,c=a.options,l=c.offsetWithOrigin?function(t){var e=t.interaction.element,n=N(G(t.state.options.origin,null,null,[e])),r=n||K(t.interactable,e,t.interaction.prepared.name);return r}(t):{x:0,y:0};if("startCoords"===c.offset)e={x:n.coords.start.page.x,y:n.coords.start.page.y};else{var u=G(c.offset,r,i,[n]);(e=N(u)||{x:0,y:0}).x+=l.x,e.y+=l.y}var p=c.relativePoints;a.offsets=o&&p&&p.length?p.map((function(t,n){return{index:n,relativePoint:t,x:s.left-o.width*t.x+e.x,y:s.top-o.height*t.y+e.y}})):[{index:0,relativePoint:null,x:e.x,y:e.y}]},set:function(t){var e=t.interaction,n=t.coords,r=t.state,i=r.options,o=r.offsets,a=K(e.interactable,e.element,e.prepared.name),s=V({},n),c=[];i.offsetWithOrigin||(s.x-=a.x,s.y-=a.y);for(var l=0,u=o;l<u.length;l++)for(var p=u[l],f=s.x-p.x,d=s.y-p.y,h=0,v=i.targets.length;h<v;h++){var g=i.targets[h],m=void 0;(m=w.func(g)?g(f,d,e._proxy,p,h):g)&&c.push({x:(w.number(m.x)?m.x:f)+p.x,y:(w.number(m.y)?m.y:d)+p.y,range:w.number(m.range)?m.range:i.range,source:g,index:h,offset:p})}for(var y={target:null,inRange:!1,distance:0,range:0,delta:{x:0,y:0}},b=0;b<c.length;b++){var x=c[b],E=x.range,T=x.x-s.x,S=x.y-s.y,_=Q(T,S),P=_<=E;E===1/0&&y.inRange&&y.range!==1/0&&(P=!1),y.target&&!(P?y.inRange&&E!==1/0?_/E<y.distance/y.range:E===1/0&&y.range!==1/0||_<y.distance:!y.inRange&&_<y.distance)||(y.target=x,y.distance=_,y.range=E,y.inRange=P,y.delta.x=T,y.delta.y=S)}return y.inRange&&(n.x=y.target.x,n.y=y.target.y),r.closest=y,y},defaults:{range:1/0,targets:null,offset:null,offsetWithOrigin:!0,origin:null,relativePoints:null,endOnly:!1,enabled:!1}},Cn=be(Rn,"snap");var jn={start:function(t){var e=t.state,n=t.edges,r=e.options;if(!n)return null;t.state={options:{targets:null,relativePoints:[{x:n.left?0:1,y:n.top?0:1}],offset:r.offset||"self",origin:{x:0,y:0},range:r.range}},e.targetFields=e.targetFields||[["width","height"],["x","y"]],Rn.start(t),e.offsets=t.state.offsets,t.state=e},set:function(t){var e=t.interaction,n=t.state,r=t.coords,i=n.options,o=n.offsets,a={x:r.x-o[0].x,y:r.y-o[0].y};n.options=V({},i),n.options.targets=[];for(var s=0,c=i.targets||[];s<c.length;s++){var l=c[s],u=void 0;if(u=w.func(l)?l(a.x,a.y,e):l){for(var p=0,f=n.targetFields;p<f.length;p++){var d=f[p],h=d[0],v=d[1];if(h in u||v in u){u.x=u[h],u.y=u[v];break}}n.options.targets.push(u)}}var g=Rn.set(t);return n.options=i,g},defaults:{range:1/0,targets:null,offset:null,endOnly:!1,enabled:!1}},Fn=be(jn,"snapSize");var Xn={aspectRatio:yn,restrictEdges:kn,restrict:Tn,restrictRect:In,restrictSize:An,snapEdges:be({start:function(t){var e=t.edges;return e?(t.state.targetFields=t.state.targetFields||[[e.left?"left":"right",e.top?"top":"bottom"]],jn.start(t)):null},set:jn.set,defaults:V(ge(jn.defaults),{targets:void 0,range:void 0,offset:{x:0,y:0}})},"snapEdges"),snap:Cn,snapSize:Fn,spring:xn,avoid:xn,transform:xn,rubberband:xn},Yn={id:"modifiers",install:function(t){var e=t.interactStatic;for(var n in t.usePlugin(Ee),t.usePlugin(hn),e.modifiers=Xn,Xn){var r=Xn[n],i=r._defaults,o=r._methods;i._methods=o,t.defaults.perAction[n]=i}}},Ln=Yn,qn=function(t){s(n,t);var e=p(n);/**
 * Erstellt ein normalisiertes InteractEvent für Tap- und Doubletap-Ereignisse.
 *
 * @param {string} t - Der Ereignis-Typ (z. B. "tap" oder "doubletap").
 * @param {Object} i - Das Pointer-/Zeiger-Ereignis, das das Tap ausgelöst hat.
 * @param {Event} o - Das ursprüngliche native Event, falls vorhanden.
 * @param {EventTarget} a - Das Ziel-Element des Interaktionsereignisses.
 * @param {Interaction} s - Die zugehörige Interaction-Instanz mit Pointer-/Tap-Zustand.
 * @param {number} c - Zeitstempel für das erzeugte Ereignis (in ms).
 * @returns {InteractEvent} Ein InteractEvent-Objekt mit normalisierten Eigenschaften:
 *                          Zeitstempel, Originalevent, Pointer-ID/-Typ, Ziel, dt und double (für Tap/Doubletap).
 */
function n(t,i,o,a,s,c){var l;if(r(this,n),tt(u(l=e.call(this,s)),o),o!==i&&tt(u(l),i),l.timeStamp=c,l.originalEvent=o,l.type=t,l.pointerId=at(i),l.pointerType=dt(i),l.target=a,l.currentTarget=null,"tap"===t){var p=s.getPointerIndex(i);l.dt=l.timeStamp-s.pointers[p].downTime;var f=l.timeStamp-s.tapTime;l.double=!!s.prevTap&&"doubletap"!==s.prevTap.type&&s.prevTap.target===l.target&&f<500}else"doubletap"===t&&(l.dt=i.timeStamp-s.tapTime,l.double=!0);return l}return o(n,[{key:"_subtractOrigin",value:function(t){var e=t.x,n=t.y;return this.pageX-=e,this.pageY-=n,this.clientX-=e,this.clientY-=n,this}},{key:"_addOrigin",value:function(t){var e=t.x,n=t.y;return this.pageX+=e,this.pageY+=n,this.clientX+=e,this.clientY+=n,this}},{key:"preventDefault",value:function(){this.originalEvent.preventDefault()}}]),n}(vt),Bn={id:"pointer-events/base",before:["inertia","modifiers","auto-start","actions"],install:function(t){t.pointerEvents=Bn,t.defaults.actions.pointerEvents=Bn.defaults,V(t.actions.phaselessTypes,Bn.types)},listeners:{"interactions:new":function(t){var e=t.interaction;e.prevTap=null,e.tapTime=0},"interactions:update-pointer":function(t){var e=t.down,n=t.pointerInfo;if(!e&&n.hold)return;n.hold={duration:1/0,timeout:null}},"interactions:move":function(t,e){var n=t.interaction,r=t.pointer,i=t.event,o=t.eventTarget;t.duplicate||n.pointerIsDown&&!n.pointerWasMoved||(n.pointerIsDown&&Gn(t),Vn({interaction:n,pointer:r,event:i,eventTarget:o,type:"move"},e))},"interactions:down":function(t,e){!function(t,e){for(var n=t.interaction,r=t.pointer,i=t.event,o=t.eventTarget,a=t.pointerIndex,s=n.pointers[a].hold,c=q(o),l={interaction:n,pointer:r,event:i,eventTarget:o,type:"hold",targets:[],path:c,node:null},u=0;u<c.length;u++){var p=c[u];l.node=p,e.fire("pointerEvents:collect-targets",l)}if(!l.targets.length)return;for(var f=1/0,d=0,h=l.targets;d<h.length;d++){var v=h[d].eventable.options.holdDuration;v<f&&(f=v)}s.duration=f,s.timeout=setTimeout((function(){Vn({interaction:n,eventTarget:o,pointer:r,event:i,type:"hold"},e)}),f)}(t,e),Vn(t,e)},"interactions:up":function(t,e){Gn(t),Vn(t,e),function(t,e){var n=t.interaction,r=t.pointer,i=t.event,o=t.eventTarget;n.pointerWasMoved||Vn({interaction:n,eventTarget:o,pointer:r,event:i,type:"tap"},e)}(t,e)},"interactions:cancel":function(t,e){Gn(t),Vn(t,e)}},PointerEvent:qn,fire:Vn,collectEventTargets:Wn,defaults:{holdDuration:600,ignoreFrom:null,allowFrom:null,origin:{x:0,y:0}},types:{down:!0,move:!0,up:!0,cancel:!0,tap:!0,doubletap:!0,hold:!0}};/**
 * Erstellt ein normalisiertes Interact-Pointer-Event und verteilt es an die passenden Targets.
 *
 * Erzeugt eine qn-basierte PointerEvent-Instanz für den angegebenen Pointer/Native-Event, feuert globale Hooks
 * ("pointerEvents:new" vor und "pointerEvents:fired" nach der Verteilung), verteilt das Event sequentiell an
 * die ermittelten Targets und respektiert stopPropagation/immediatePropagation. Bei einem "tap"-Ereignis wird
 * zusätzlich ein optionales "doubletap"-Event erzeugt und die Interaction-Referenz für den letzten Tap aktualisiert.
 *
 * @param {Object} t - Kontextobjekt mit Eigenschaften: interaction, pointer, event, eventTarget, type und optional targets.
 * @param {Object} e - Scope/Event-Bus-Objekt mit einer .fire(eventName, payload)-Methode.
 * @returns {qn} Die erstellte Interact-PointerEvent-Instanz.
 */
function Vn(t,e){var n=t.interaction,r=t.pointer,i=t.event,o=t.eventTarget,a=t.type,s=t.targets,c=void 0===s?Wn(t,e):s,l=new qn(a,r,i,o,n,e.now());e.fire("pointerEvents:new",{pointerEvent:l});for(var u={interaction:n,pointer:r,event:i,eventTarget:o,targets:c,type:a,pointerEvent:l},p=0;p<c.length;p++){var f=c[p];for(var d in f.props||{})l[d]=f.props[d];var h=K(f.eventable,f.node);if(l._subtractOrigin(h),l.eventable=f.eventable,l.currentTarget=f.node,f.eventable.fire(l),l._addOrigin(h),l.immediatePropagationStopped||l.propagationStopped&&p+1<c.length&&c[p+1].node!==l.currentTarget)break}if(e.fire("pointerEvents:fired",u),"tap"===a){var v=l.double?Vn({interaction:n,pointer:r,event:i,eventTarget:o,type:"doubletap"},e):l;n.prevTap=v,n.tapTime=v.timeStamp}return l}/**
 * Sammelt die passenden Pointer-Event-Ziele entlang des DOM-Pfads für ein gegebenes Pointer-Ereignis.
 *
 * @param {Object} t - Kontextobjekt des Pointer-Ereignisses.
 * @param {Object} t.interaction - Die aktuelle Interaction-Instanz.
 * @param {Object} t.pointer - Der Pointer-/Zeigerzustand.
 * @param {Event} t.event - Das ursprüngliche DOM-Ereignis.
 * @param {Element} t.eventTarget - Das unmittelbare Ziel-Element des Ereignisses.
 * @param {string} t.type - Der Pointer-Ereignistyp (z. B. "tap", "hold", ...).
 * @param {Object} e - Eventbus/Scope mit einer `fire`-Methode zum Auslösen von Sammlungs-Callbacks.
 * @returns {Array} Die gesammelten Ziel-Einträge (`targets`). Liefert ein leeres Array, wenn das Ereignis (z. B. ein verschobener "tap") keine Ziele erzeugen darf.
 */
function Wn(t,e){var n=t.interaction,r=t.pointer,i=t.event,o=t.eventTarget,a=t.type,s=n.getPointerIndex(r),c=n.pointers[s];if("tap"===a&&(n.pointerWasMoved||!c||c.downTarget!==o))return[];for(var l=q(o),u={interaction:n,pointer:r,event:i,eventTarget:o,type:a,path:l,targets:[],node:null},p=0;p<l.length;p++){var f=l[p];u.node=f,e.fire("pointerEvents:collect-targets",u)}return"hold"===a&&(u.targets=u.targets.filter((function(t){var e,r;return t.eventable.options.holdDuration===(null==(e=n.pointers[s])||null==(r=e.hold)?void 0:r.duration)}))),u.targets}/**
 * Hebt einen gesetzten Hold-Timeout für den angegebenen Pointer in der Interaction auf.
 * @param {Object} t - Kontextobjekt mit Interaktionsinformationen.
 * @param {Object} t.interaction - Die Interaction-Instanz, die die Pointer verfolgt.
 * @param {number} t.pointerIndex - Index des Pointers in interaction.pointers, dessen Hold-Timeout gelöscht werden soll.
 */
function Gn(t){var e=t.interaction,n=t.pointerIndex,r=e.pointers[n].hold;r&&r.timeout&&(clearTimeout(r.timeout),r.timeout=null)}var Nn=Object.freeze({__proto__:null,default:Bn});/**
 * Beendet das Hold-Intervall einer Interaktion und entfernt das zugehörige Handle.
 * @param {Object} t - Objekt mit der Eigenschaft `interaction`, deren `holdIntervalHandle` gelöscht und auf `null` gesetzt wird.
 */
function Un(t){var e=t.interaction;e.holdIntervalHandle&&(clearInterval(e.holdIntervalHandle),e.holdIntervalHandle=null)}var Hn={id:"pointer-events/holdRepeat",install:function(t){t.usePlugin(Bn);var e=t.pointerEvents;e.defaults.holdRepeatInterval=0,e.types.holdrepeat=t.actions.phaselessTypes.holdrepeat=!0},listeners:["move","up","cancel","endall"].reduce((function(t,e){return t["pointerEvents:".concat(e)]=Un,t}),{"pointerEvents:new":function(t){var e=t.pointerEvent;"hold"===e.type&&(e.count=(e.count||0)+1)},"pointerEvents:fired":function(t,e){var n=t.interaction,r=t.pointerEvent,i=t.eventTarget,o=t.targets;if("hold"===r.type&&o.length){var a=o[0].eventable.options.holdRepeatInterval;a<=0||(n.holdIntervalHandle=setTimeout((function(){e.pointerEvents.fire({interaction:n,eventTarget:i,type:"hold",pointer:r,event:r},e)}),a))}}})},Kn=Hn;var $n={id:"pointer-events/interactableTargets",install:function(t){var e=t.Interactable;e.prototype.pointerEvents=function(t){return V(this.events.options,t),this};var n=e.prototype._backCompatOption;e.prototype._backCompatOption=function(t,e){var r=n.call(this,t,e);return r===this&&(this.events.options[t]=e),r}},listeners:{"pointerEvents:collect-targets":function(t,e){var n=t.targets,r=t.node,i=t.type,o=t.eventTarget;e.interactables.forEachMatch(r,(function(t){var e=t.events,a=e.options;e.types[i]&&e.types[i].length&&t.testIgnoreAllow(a,r,o)&&n.push({node:r,eventable:e,props:{interactable:t}})}))},"interactable:new":function(t){var e=t.interactable;e.events.getRect=function(t){return e.getRect(t)}},"interactable:set":function(t,e){var n=t.interactable,r=t.options;V(n.events.options,e.pointerEvents.defaults),V(n.events.options,r.pointerEvents||{})}}},Jn=$n,Qn={id:"pointer-events",install:function(t){t.usePlugin(Nn),t.usePlugin(Kn),t.usePlugin(Jn)}},Zn=Qn;var tr={id:"reflow",install:function(t){var e=t.Interactable;t.actions.phases.reflow=!0,e.prototype.reflow=function(e){return function(t,e,n){for(var r=t.getAllElements(),i=n.window.Promise,o=i?[]:null,a=function(){var a=r[s],c=t.getRect(a);if(!c)return 1;var l,u=bt(n.interactions.list,(function(n){return n.interacting()&&n.interactable===t&&n.element===a&&n.prepared.name===e.name}));if(u)u.move(),o&&(l=u._reflowPromise||new i((function(t){u._reflowResolve=t})));else{var p=U(c),f=function(t){return{coords:t,get page(){return this.coords.page},get client(){return this.coords.client},get timeStamp(){return this.coords.timeStamp},get pageX(){return this.coords.page.x},get pageY(){return this.coords.page.y},get clientX(){return this.coords.client.x},get clientY(){return this.coords.client.y},get pointerId(){return this.coords.pointerId},get target(){return this.coords.target},get type(){return this.coords.type},get pointerType(){return this.coords.pointerType},get buttons(){return this.coords.buttons},preventDefault:function(){}}}({page:{x:p.x,y:p.y},client:{x:p.x,y:p.y},timeStamp:n.now()});l=function(t,e,n,r,i){var o=t.interactions.new({pointerType:"reflow"}),a={interaction:o,event:i,pointer:i,eventTarget:n,phase:"reflow"};o.interactable=e,o.element=n,o.prevEvent=i,o.updatePointer(i,i,n,!0),nt(o.coords.delta),Ut(o.prepared,r),o._doPhase(a);var s=t.window,c=s.Promise,l=c?new c((function(t){o._reflowResolve=t})):void 0;o._reflowPromise=l,o.start(r,e,n),o._interacting?(o.move(a),o.end(i)):(o.stop(),o._reflowResolve());return o.removePointer(i,i),l}(n,t,a,e,f)}o&&o.push(l)},s=0;s<r.length&&!a();s++);return o&&i.all(o).then((function(){return t}))}(this,e,t)}},listeners:{"interactions:stop":function(t,e){var n=t.interaction;"reflow"===n.pointerType&&(n._reflowResolve&&n._reflowResolve(),function(t,e){t.splice(t.indexOf(e),1)}(e.interactions.list,n))}}},er=tr;if(un.use(he),un.use(Ce),un.use(Zn),un.use(qe),un.use(Ln),un.use(pe),un.use(Xt),un.use(Gt),un.use(er),un.default=un,"object"===("undefined"==typeof module?"undefined":n(module))&&module)try{module.exports=un}catch(t){}return un.default=un,un}));
//# sourceMappingURL=interact.min.js.map