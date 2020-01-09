import shortid from 'shortid';
import _ from 'lodash';
import AnimationRegistry from '../../../animations/AnimationRegistry';


function svg(name, args, childElements) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
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
    return element;
}

class ParticleEffectAnimation {
    constructor(connector, args) {
        this.connector = connector;
        this.args = args;
        this.domContainer = null;
        this.domConnectorPath = null;
        this.particles = [];
        this.timeToNextParticle = 0.0;
        this.particlesLeft = args.particlesCount;
        this.totalPathLength = 0;
        this.growthDistance = args.growthDistance;
        this.declineDistance = args.declineDistance;
        this.id = shortid.generate();
    }

    // is invoked before playing. must return status whether it has succeeded initializing animation elements
    init() {
        this.domContainer = document.getElementById(`animation-container-connector-${this.connector.id}`);
        this.domConnectorPath = document.getElementById(`connector-${this.connector.id}-path`);

        if (!this.domContainer || !this.domConnectorPath) {
            return false;
        }
        
        this.totalPathLength = this.domConnectorPath.getTotalLength();
        const midPath = this.totalPathLength/2;
        this.growthDistance = Math.min(this.growthDistance, midPath);
        this.declineDistance = Math.min(this.declineDistance, midPath);

        // this.domContainer.appendChild(svg('defs', {}, [
        //     svg('filter', {id: `blur-filter-${this.id}`}, [
        //         svg('feGaussianBlur', {
        //             in: 'SourceGraphic',
        //             stdDeviation: '2'
        //         })
        //     ])
        // ]));
        return true;
    }

    // returns true or false whether animation should proceed. in case it returns false - it means that animation has finished and it will invoke destroy function
    play(dt) {
        if (this.particles.length === 0 && this.particlesLeft <= 0) {
            return false;
        }

        if (this.particlesLeft > 0) {
            this.timeToNextParticle -= dt;
            if (this.timeToNextParticle <= 0.0) {
                this.timeToNextParticle = this.args.offsetTime * 1000.0;
                this.createParticle();
            }
        }
        
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].pathPosition += this.args.speed * dt / 1000.0;
            if (this.particles[i].pathPosition > this.totalPathLength) {
                this.domContainer.removeChild(this.particles[i].domParticle);
                this.particles.splice(i, 1);
                i = i - 1;
            } else {
                const point = this.domConnectorPath.getPointAtLength(this.particles[i].pathPosition);

                this.particles[i].domParticle.setAttribute('cx', point.x);
                this.particles[i].domParticle.setAttribute('cy', point.y);

                if (this.particles[i].pathPosition < this.growthDistance && this.growthDistance >= 1.0) {
                    const size = this.args.particleSize * (1.0 - (this.growthDistance - this.particles[i].pathPosition) / this.growthDistance);
                    this.particles[i].domParticle.setAttribute('r', size/2);
                }
                if (this.particles[i].pathPosition > this.totalPathLength - this.declineDistance && this.declineDistance >= 1.0) {
                    const size = this.args.particleSize * (this.totalPathLength - this.particles[i].pathPosition) / this.declineDistance;
                    this.particles[i].domParticle.setAttribute('r', size/2);
                }
            }
        }
        return true;
    }

    // invoked when animation is instructed to remove its elements from dom.
    destroy() {
        _.forEach(this.particles, particle => {
            this.domContainer.removeChild(particle.domParticle);
        });
    }

    createParticle() {
        const point = this.domConnectorPath.getPointAtLength(0);
        const domParticle = svg('circle', {
            cx: point.x,
            cy: point.y,
            r: this.args.particleSize / 2,
            fill: this.args.color,
            // style: `filter: url(#blur-filter-${this.id});`
        });

        this.domContainer.appendChild(domParticle);

        this.particles.push({
            pathPosition: 0.0,
            domParticle
        });

        this.particlesLeft -= 1;
    }
}

export default {
    name: 'Particle Effect',
    args: {
        particleSize:   {name: 'Particle Size',     type: 'number', value: 10},
        color:          {name: 'Color',             type: 'color',  value: 'rgba(255,0,0,1.0)'},
        speed:          {name: 'Speed',             type: 'number', value: 60},
        particlesCount: {name: 'Particles',         type: 'number', value: 1},
        offsetTime:     {name: 'Offset time (sec)', type: 'number', value: 0.5},
        growthDistance: {name: 'Growth Distance',   type: 'number', value: 30},
        declineDistance:{name: 'Decline Distance',  type: 'number', value: 30},
    },

    execute(connector, args) {
        if (connector) {
            AnimationRegistry.play(new ParticleEffectAnimation(connector, args))
        }
    }
};