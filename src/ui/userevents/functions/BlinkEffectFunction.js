import AnimationRegistry from '../../animations/AnimationRegistry';
import Animation from '../../animations/Animation';
import Shape from '../../components/editor/items/shapes/Shape';


class BlinkEffectAnimation extends Animation {
    constructor(item, args, resultCallback) {
        super();
        this.item = item;
        this.args = args;
        this.resultCallback = resultCallback;
        this.elapsedTime = 0.0;
        this.domContainer = null;
        this.domBlinker = null;
    }

    init() {
        this.domContainer = document.getElementById(`animation-container-${this.item.id}`);

        const shape = Shape.find(this.item.shape);
        if (!shape) {
            return false;
        }

        this.domBlinker = this.svg('path', {
            'd':            shape.computeOutline(this.item),
            'stroke-width': 3,
            'stroke':       this.args.color,
            'fill':         this.args.color,
            'style':        `opacity: ${this.args.minOpacity}`
        });

        this.domContainer.appendChild(this.domBlinker);
        return true;
    }

    play(dt) {
        this.elapsedTime += dt;

        const opacity = ((Math.sin(this.elapsedTime * this.args.speed / 10000.0) / 2 + 0.5) * (this.args.maxOpacity - this.args.minOpacity) + this.args.minOpacity) / 100.0;
        
        this.domBlinker.setAttribute('style', `opacity: ${opacity}`);
        return this.elapsedTime < this.args.duration * 1000.0;
    }

    destroy() {
        if (!this.args.inBackground) {
            this.resultCallback();
        }
        if (this.domBlinker) {
            this.domContainer.removeChild(this.domBlinker);
        }
    }

}

export default {
    name: 'Blink Effect',

    description: 'Generates a pulsating effect in which item glows with specified color',

    args: {
        color           : {name: 'Color',             type: 'color',  value: 'rgba(255,0,0,1.0)'},
        speed           : {name: 'Speed',             type: 'number', value: 50},
        duration        : {name: 'Duration (sec)',    type: 'number', value: 5.0},
        minOpacity      : {name: 'Min Opacity (%)',   type: 'number', value: 5},
        maxOpacity      : {name: 'Max Opacity (%)',   type: 'number', value: 80},
        inBackground    : {name: 'In Background',     type: 'boolean', value: false, description: 'Play animation in background without blocking invokation of other acctions'}
    },

    execute(item, args, schemeContainer, userEventBus, resultCallback) {
        if (item) {
            AnimationRegistry.play(new BlinkEffectAnimation(item, args, resultCallback), item.id);

            if (args.inBackground) {
                resultCallback();
            }
        }
    }
}