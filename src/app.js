import clipboard from './clipboard.js';;

const Instruments = {
    Default : {
        'folder': 'scale',
        'notes': ['c5', 'd5', 'e5', 'f5', 'g5', 'a6', 'b6', 'c6', 'd6']
    },

    Bottle: {
        'folder': 'bottle',
        'notes': ['c5', 'd5', 'e5', 'f5', 'g5', 'a6', 'b6', 'c6', 'd6'],
    },

    Kidsos: {
        'folder': 'kidsos',
        'notes': ['c5', 'd5', 'e5', 'f5', 'g5', 'a6', 'b6', 'c6', 'd6'],
    },

    Drumkit: {
        'folder': 'drums',
        'notes': ['kick', 'snare', 'kick', 'snare', 'kick', 'snare-side', 'closed-hat', 'pedal-high-hat', 'half-high-hat'],
    }
}

const States = {
    EMPTY : 0,
    UP : 1,
    DOWN : 2,
    LEFT : 4,
    RIGHT : 8,
}

const Axis = {
    HORIZONTAL: 1,
    VERTICAL: 2
}

class Cell {
    constructor() {
        this.state = States.EMPTY;
        this.ding = -1000;
    }
}

class App {
    constructor() {
        this.cells = [];
        this.cellBuff = [];

        this.speed = 250;
        this.paused = true;
        this.size = 9;

        this.setInstrument(Instruments.Default);
        this.init();
        this.createGrid();


        this.loadFromHash();
    }

    loadFromHash() {
        let hash = window.location.hash;

        if (hash) {
            this.deserialize(hash.substr(1));
        }
    }

    init() {

        window.addEventListener('hashchange', this.loadFromHash.bind(this));
        document.body.addEventListener('keydown', (ev) => {
            if (ev.which == 32)
                this.toggle()
        });

        let instSel = document.querySelector('.instrument');
        instSel.addEventListener('change', () => {
            this.setInstrument(Instruments[instSel.value]);
        });

        let button = document.querySelector('.toggle');
        button.addEventListener('click', this.toggle.bind(this));

        let clear = document.querySelector('.clear');
        clear.addEventListener('click', this.createGrid.bind(this));

        let save = document.querySelector('.save');
        save.addEventListener('click', (ev) => {
            clipboard.copy(this.serialize());

            this.showPopup('Copied to clipboard', ev.pageX, ev.pageY);
        });
        
        let saveURL = document.querySelector('.saveURL');
        saveURL.addEventListener('click', (ev) => {
            let code = this.serialize()
            let url = window.location.href.split('#')[0];

            clipboard.copy(`${url}#${code}`);

            this.showPopup('Copied to clipboard', ev.pageX, ev.pageY);
        });

        let load = document.querySelector('.load');
        
        load.addEventListener('click', () => {
            let data = prompt('Enter data:');
            this.deserialize(data);
        });

        let stepBTN = document.querySelector('.step');
        stepBTN.addEventListener('click', () => {
            this.paused = false;
            this.update();
            this.paused = true;
        });

        this.grid = document.querySelector('.grid');
        this.grid.addEventListener('click', this.onClick.bind(this));
        this.grid.addEventListener('contextmenu', this.onRightClick.bind(this));

        
    }

    showPopup(text, x, y) {
        let popup = document.querySelector('.popup.hidden').cloneNode(true);
        popup.textContent = text;
        document.body.append(popup);

        popup.style.left = x + 'px';
        popup.style.top = y + 'px';

        popup.classList.remove('hidden')

        setTimeout(() => {
            popup.classList.add('active');
        }, 0);

        setTimeout(() => {
            popup.remove();
        }, 1000)
    }

    createGrid() {
        let size = this.size;
        
        this.cells = [];
        this.cellBuff = [];
        
        while (this.grid.children.length) {
            this.grid.children[0].remove();
        }

        for (let i = 0; i < size; ++i) {
            for (let j = 0; j < size; ++j) {
                let cell = document.createElement('div');
                cell.classList.add('cell', 'empty');
                
                this.grid.append(cell);

                this.cells.push(new Cell());
                this.cellBuff.push(new Cell());
            }
        }

        this.grid.style.display = 'grid';
        this.grid.style.gridTemplateColumns = '11% '.repeat(size);
        this.grid.style.gridTemplateRows = '11% '.repeat(size);
    }

    toggle() {
        this.paused = !this.paused;

        if (!this.paused)
            this.update();
    }

    onClick(ev) {
        let cellEl = ev.target;
        if (!cellEl.classList.contains('cell'))
            return;
        
        let index = Array.prototype.indexOf.call(cellEl.parentNode.children, cellEl) 
        
        if (this.cells[index].state == States.EMPTY)
            this.cells[index].state |= States.UP;
        else if (this.cells[index].state == States.RIGHT)
            this.cells[index].state = States.EMPTY;
        else this.cells[index].state = this.rotate(this.cells[index].state);
        this.render();
    }

    onRightClick(ev) {
        ev.preventDefault();

        let cellEl = ev.target;

        if (!cellEl.classList.contains('cell'))
            return;

        let index = Array.prototype.indexOf.call(cellEl.parentNode.children, cellEl)
        this.cells[index].state = States.EMPTY;
        this.render();
    }

    clear(cellList) {
        for (let i = 0; i < cellList.length; ++i) {
            cellList[i].state = States.EMPTY;
        }
    }

    copyTo(cellsA, cellsB) {
        for (let i = 0; i < cellsA.length; ++i) {
            cellsB[i].state = cellsA.state;
        }
    }

    applyState(cells, x, y, state) {
        let cell = cells[x + y * this.size];

        cell.state = cell.state | state;
    }

    rotate(state) {
        let newState = States.EMPTY;

        if (state & States.UP) {
            newState |= States.LEFT;
        }

        if (state & States.LEFT) {
            newState |= States.DOWN;
        }

        if (state & States.DOWN) {
            newState |= States.RIGHT;
        }

        if (state & States.RIGHT) {
            newState |= States.UP;
        }

        return newState;
    }


    getCell(x, y) {
        return this.cells[x + y * this.size];
    }
    
    powerOf2(v) {
        return v && !(v & (v - 1));
    }


    update() {

        if (this.timeoutID)
            clearTimeout(this.timeoutID);
        
        if (this.paused)
            return;
        
        this.clear(this.cellBuff);
        
        for (let i = 0; i < this.cells.length; ++i) {
            let cell = this.cells[i];
            
            let x = i % this.size;
            let y = (i - x) / this.size;

            if (cell.state == States.EMPTY) {
                continue;
            }

            if (cell.state & States.UP) {
                if (y == 0) {
                    this.ding(x, Axis.VERTICAL);
                    this.applyState(this.cellBuff, x, y + 1, States.DOWN);
                }
                else {
                    this.applyState(this.cellBuff, x, y - 1, States.UP);
                }
            }

            if (cell.state & States.DOWN) {
                if (y >= this.size - 1) {
                    this.ding(x, Axis.VERTICAL);
                    this.applyState(this.cellBuff, x, y - 1, States.UP);
                }
                else {
                    this.applyState(this.cellBuff, x, y + 1, States.DOWN);
                }
            }


            if (cell.state & States.LEFT) {
                if (x == 0) {
                    this.ding(y, Axis.HORIZONTAL);
                    this.applyState(this.cellBuff, x + 1, y, States.RIGHT);
                } else {
                    this.applyState(this.cellBuff, x - 1, y, States.LEFT);
                }
            }

            if (cell.state & States.RIGHT) {
                if (x >= this.size - 1) {
                    this.ding(y, Axis.HORIZONTAL);
                    this.applyState(this.cellBuff, x - 1, y, States.LEFT);
                } else {
                    this.applyState(this.cellBuff, x + 1, y, States.RIGHT);
                }
            }
        }

        for (let i = 0; i < this.cellBuff.length; ++i) {
            let cell = this.cellBuff[i];

            if (!this.powerOf2(cell.state)) {
                cell.state = this.rotate(cell.state);
            }
        }

        let temp = this.cells;

        this.cells = this.cellBuff;
        this.cellBuff = temp;

        setTimeout(() => {
            this.render();
        }, 0);

        this.timeoutID = setTimeout(() => {
            this.update();
        }, this.speed);
    }

    render() {
        for (let i = 0; i < this.cells.length; ++i) {
            let cell = this.cells[i];

            let cellEl = this.grid.children[i];
            cellEl.classList.value = 'cell';
            
            let now = performance.now();

            if (now - cellEl.lastDing < 250) {
                cellEl.classList.add('ding');
            }

            if (cell.state == States.EMPTY) {
                cellEl.classList.add('empty');
                continue;
            }

            if (cell.state & States.UP) {
                cellEl.classList.add('up');
            }

            if (cell.state & States.DOWN) {
                cellEl.classList.add('down');
            }

            if (cell.state & States.LEFT) {
                cellEl.classList.add('left');
            }

            if (cell.state & States.RIGHT) {
                cellEl.classList.add('right');
            }
        }
    }

    compress(str) {
        let match;
        while (match = str.match('0{2,}')) {
            let n = (match[0].length).toString(16);

            if (n.length == 1)
                n = '0' + n;
            
            n = '_' + n;
            
            str = str.substr(0, match.index) + n + str.substr(match.index + match[0].length);

        }

        return str;
    }

    decompress(str) {
        let match;
        while (match = str.match('_')) {
            let len = str.substr(match.index+1, 2);
            len = parseInt(len, 16);
            let n = '0'.repeat(len);
            str = str.substr(0, match.index) + n + str.substr(match.index + 3);
        }
        return str;
    }

    serialize() {
        let dec = [];
        let hex = '';
        
        dec.push(this.instrumentIndex);
        dec.push(this.size);

        let n = 0;
        for (let i = 0; i < this.cells.length; ++i) {
            if (i % 2 == 0) {
                n = this.cells[i].state << 4;
            } else {
                n = n | this.cells[i].state;
                dec.push(n);
            }
        }

        for (let i = 0; i < dec.length; ++i) {
            let str = (dec[i]).toString(16);

            if (str.length == 1)
                str = '0' + str;
            
            hex += str;
        }
        console.log(hex);
        return 'v2,' + this.compress(hex);
    }

    deserialize(data) {
        data = this.decompress(data);
        
        
        let version = 1;

        
        let vmatch;

        if (vmatch = data.match('^v[0-9]+\,')) {
            data = data.substr(vmatch[0].length);

            version = vmatch[0].substring(1, vmatch[0].length - 1);
        }

        console.log(version, data);
        if (data.length % 2 == 1) {
            alert("Malformed state data")
            return;
        }

        let dec = [];

        while (data.length) {
            let byte = data.substr(0,2);
            data = data.substr(2);

            dec.push(parseInt(byte, 16));
        }

        if (version == 2) {
            let instrumentIndex = dec.shift();
            this.setInstrument(Object.values(Instruments)[instrumentIndex]);
        }
        
        let size = dec.shift();
        this.size = size;
        
        this.createGrid();

        for (let i = 0; i < dec.length; ++i) {
            let cellA = this.cells[i * 2];
            let cellB = this.cells[i * 2 + 1];

            let states = dec[i];

            cellB.state = (states & States.UP) | (states & States.DOWN) | (states & States.LEFT) | (states & States.RIGHT);
            states = (states & ~cellB.state) >> 4;
            cellA.state = (states & States.UP) | (states & States.DOWN) | (states & States.LEFT) | (states & States.RIGHT);
        }

        this.render();
    }

    ding(note, axis) {
        // let scale = ['floor-tom', 'low-tom', 'mid-tom', 'kick', 'snare', 'snare-side', 'closed-hat', 'pedal-high-hat', 'half-high-hat'];
        // let scale = ['kick', 'snare', 'kick', 'snare', 'kick', 'snare-side', 'closed-hat', 'pedal-high-hat', 'half-high-hat'];
        let scale = this.instrument.notes;//['c5', 'd5', 'e5', 'f5', 'g5', 'a6', 'b6', 'c6', 'd6'];
        let str = scale[note];
        
        let aud = new Audio(`audio/${this.instrument.folder}/${str}.ogg`);
        aud.autoplay = true;

        for (let j = 0; j < this.size; ++j) {
            let index;
            if (axis == Axis.HORIZONTAL) {
                index = j + note * this.size;
            } else {
                index = note + j * this.size;
            }
            
            let cellEl = this.grid.children[index]
            cellEl.lastDing = performance.now();

            cellEl.classList.remove('ding');
        }
    }

    setInstrument(instrument) {
        this.instrumentIndex = Object.values(Instruments).indexOf(instrument);
        this.instrument = instrument;
        this.preload();

        let instSel = document.querySelector('.instrument');
        let target = Object.keys(Instruments)[this.instrumentIndex];
        instSel.value = target;
    }

    preload() {
        let folder = this.instrument.folder;
        let notes = this.instrument.notes;

        notes.forEach((note) => {
            

            let aud = new Audio(`audio/${folder}/${note}.ogg`);
            aud.autoplay = false;
        });
    }

}

new App();