Schemio
--------------------

Schemio is a web based service for creating and viewing schemes online. It lets you design any scheme you want, link items to other schemes and provide description for each item. The basic idea behind Schemio is to provide visual and structured documentation so anyone can get a good understanding of a project.




```js
"behavior": [ {
    "on": {
    "entity": {
        "item": "self"
    },
    "event": "Frame-1",
    "args": [ ]
    },
    "do": [ {
        "entity": {
            "item": "some-id232313",
            "connector": "connection-id-wer32423423"
        },
        "method": "show",
        "args": [ ]
    }, {
        "item": { 
            // this means that the method should be invoked on the page itself
        }
    } ]
}]
```

```js
"behavior": [ {
    "id": "oSzmeoKYo",
    "on": {
    "element": {
        "item": "self"
    },
    "event": "clicked",
    "args": [
        
    ]
    },
    "do": [ {
        "element": {
        "item": "y5fZ65n1If"
        },
        "method": "show",
        "args": {
        "animated": true,
        "animationDuration": "0.5"
        }
    }, {
        "element": {
        "item": "y5fZ65n1If"
        },
        "method": "sendEvent",
        "args": {
        "event": "Play search dns"
        }
    } ]
} ]
```

```js
item = {
    behavior: {
        events: [{
            event: 'clicked',
            actions: [{
                element: 'item: #y455454', // will use custom element selector
                method: "show",
                args: {
                    animated: true,
                    animationDuration: 0.5
                }
            }]
        }]
    } 
}
```

Item selectors:
```js
/****** Current implementation *********/
'item: #abc'            // specifies item with id abc
'connector: #abc'       // connection with id abc
'self'                  // references itself
'tag: reset'            // anything that was tagged with 'reset' tag


/******** another suggestion ***********/
'#abc'                  // matches anything with id abc (item or connector)
'~Browser'              // by name "Browser"
'self'                  // self
'&reset'                // anything tagged with 'reset'


/****** ideas for future extension *********/
'item: "Browser"'       // item with "Browser" name
'connector: "Incoming"' // connector with "Incoming" name
'page'                  // page, probably would be used for global functions like open url, load, open popup, etc.
```



#### Some ideas for redesigning of item behavior using custom language
##### v1
```
describe `item: "Browser"` {
    on "init" {
        `self` -> trigger(event: "Do fancy stuff")
    }
    on "clicked" {
        `item: #rqwtqwt` -> hide(
            animated: true,
            duration: 0.5,
            inBackground: false
        )
    }
    on "Do fancy stuff" {
        `self` -> opacity = 0.1
        `item: #wqqqwe`
    }
}

# Describes all items that were marked with "reset" tag
describe `tag: "reset"` {
    on "init" {
        `self` -> hide()
    }
}
```

##### v2
```
describe('item: "Browser"') {
    init() {
        `self`.triggerEvent(event: 'Do fancy stuff')
    }

    /// or in another form
    on('init') {

    }

    clicked() {
        // ....
    }

    on('some custom event') {
        // ....
    }

    // example of using event arguments
    on('metrics-update') {
        `self`.opacity = $.value * 100
        `self`.fieldTransition(field: 'color', value1: '#000000', value2: '#ff00ff', value: $.value, min: 0, max: 100)
    }
}
```

##### v3
```
describe `~Browser` {
    on 'init' {
        self.triggerEvent(event: 'custom event', args: [value: 23])   
    }
    on 'custom event' { 
        self.opacity = event.value * 100
        self.fieldTransition(field: 'color', value1: '#000000', value2: '#ff00ff', value: $.value, min: 0, max: 100)
    }
    on 'click' {
        `~Button`.show(animated: true)
        `#qwqwr`.triggerEvent(event: 'some other event')
    }

    on 'frame' [number: 1] {

    }
    on 'frame' [number: 2] {

    }
}


// example of structures
x = [
    number: 1,
    age: 35,
    name: 'John'
]

// array
x = [0, 2, 3]

// code block
func = {
    print(w)
}

// code block with arguments
func = function (x, y, z) { 
    print(x + y * z)
}

// if statement
if (x > y) {
    ....
} else {
    ....
}

// for loop
for x, i in [0 to 10] {

}

```


License
---------
This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
