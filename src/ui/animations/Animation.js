export default class Animation { 
    /**
     * Invoked before playing. 
     * @returns Boolean status whether it has succeeded initializing animation elements
     */
    init() {
        return true;
    }

    /**
     * Function that is invoked on each frame.
     * In case it returns false - it means that animation has finished and it will invoke destroy function
     * @param {Number} dt delta time between frames of animation
     * @returns Boolean status that specifies whether animation should proceed. 
     */
    play(dt) {
        return false;
    }

    /**
     * Invoked when animation is instructed to remove its elements from dom.
     */
    destroy() { }

    svg(name, args, childElements) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', name);
        this._enrichDomElement(element, args, childElements);
        return element;
    }

    html(name, args, childElements) {
        const element = document.createElement(name);
        this._enrichDomElement(element, args, childElements);
        return element;
    }


    _enrichDomElement(element, args, childElements) {
        if (args) {
            _.forEach(args, (value, argName) => {
                element.setAttribute(argName, value);
            })
        }

        if (childElements) {
            _.forEach(childElements, childElement => {
                element.appendChild(childElement);
            })
        }
    }
}