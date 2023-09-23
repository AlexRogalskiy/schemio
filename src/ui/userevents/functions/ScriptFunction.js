/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { playInAnimationRegistry } from "../../animations/AnimationRegistry";
import ValueAnimation from "../../animations/ValueAnimation";
import EditorEventBus from "../../components/editor/EditorEventBus";
import { Scope, parseAST } from "../../templater/ast";
import { tokenizeExpression } from "../../templater/tokenizer";

export default {
    name: 'Script',

    description: 'Runs user defined script using Schemio expression language.',

    args: {
        script              : {name: 'Script', type: 'script', value: '', description: 'A Schemio script expression. If script runs in animation mode, then the script is exposed to "t" variable which represents the animation time from 0 to 1'},
        animated            : {name: 'Animated', type: 'boolean', value: false},
        animationDuration   : {name: 'Animation duration (sec)', type: 'number', value: 0.5, depends: {animated: true}},
        transition          : {name: 'Transition', type: 'choice', value: 'ease-out', options: ['linear', 'smooth', 'ease-in', 'ease-out', 'ease-in-out', 'bounce'], depends: {animated: true}},
        inBackground        : {name: 'In Background', type: 'boolean', value: false, depends: {animated: true}, description: 'Play animation in background without blocking invokation of other actions'}
    },

    execute(item, args, schemeContainer, userEventBus, resultCallback) {
        const scriptAST = parseItemScript(args.script);
        if (!scriptAST) {
            resultCallback();
            return;
        }

        const scope = createItemBasedScope(item, schemeContainer, userEventBus);

        const execScript = (t) => {
            scope.set('t', t);
            scriptAST.evalNode(scope);
        };

        if (args.animated) {
            playInAnimationRegistry(schemeContainer.editorId, new ValueAnimation({
                durationMillis: args.animationDuration * 1000.0,
                animationType: args.transition,
                init() { },
                update(t) {
                    execScript(t);
                },
                destroy() {
                    if (!args.inBackground) {
                        resultCallback();
                    }
                }
            }), item.id, this.name + args.script);
            if (args.inBackground) {
                resultCallback();
            }
        } else {
            try {
                execScript(0);
            } catch (err) {
                console.error(`Failed executing item script: ${args.script}`, err);
            }
            resultCallback();
        }
    }
}

export function createItemBasedScope(item, schemeContainer, userEventBus) {
    const emitItemChanged = () => {
        EditorEventBus.item.changed.specific.$emit(schemeContainer.editorId, item.id);
    };
    return new Scope({
        setVar(name, value) {
            if (!item.args) {
                item.args = {};
            }
            if (!item.args.customVars) {
                item.args.customVars = {};
            }

            item.args.customVars[name] = value;
        },

        getVar(name, defaultValue) {
            if (!item.args || !item.args.customVars || !item.args.customVars.hasOwnProperty(name)) {
                return defaultValue;
            }
            return item.args.customVars[name];
        },

        getPosX() {
            return item.area.x;
        },

        getPosY() {
            return item.area.y;
        },

        setPosX(x) {
            item.area.x = x;
            emitItemChanged();
        },

        setPosY(y) {
            item.area.y = y;
            emitItemChanged();
        }
    });
}

export function parseItemScript(text) {
    try {
        return parseAST(tokenizeExpression(text));
    } catch (err) {
        console.error('Failed to parse item script: ' + text, err);
        return null;
    }
}