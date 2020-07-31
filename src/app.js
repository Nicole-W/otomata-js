const States = {
    EMPTY : 0,
    UP : 1,
    DOWN : 2,
    LEFT : 4,
    RIGHT : 8,
    VERTICAL : 16,
    HORIZONTAL : 32
}

class Cell {
    constructor() {
        this.state = States.EMPTY;
    }
}

class App {
    constructor() {
        this.cells = [];
        this.cellBuff = [];

        this.speed = 250;
        this.paused = true;
        this.size = 9;

        this.createGrid();

    }

    createGrid() {
        let size = this.size;

        let button = document.querySelector('.toggle');
        button.addEventListener('click', this.toggle.bind(this));

        let stepBTN = document.querySelector('.step');
        stepBTN.addEventListener('click', () => {
            this.paused = false;
            this.update();
            this.paused = true;
        });

        this.grid = document.querySelector('.grid');
        this.grid.addEventListener('click', this.onClick.bind(this));
        this.grid.addEventListener('contextmenu', this.onRightClick.bind(this));

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

        // console.log(`Rotated ${state} to ${newState}`)
        return newState;
    }


    getCell(x, y) {
        return this.cells[x + y * this.size];
    }
    
    powerOf2(v) {
        return v && !(v & (v - 1));
    }


    update() {
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
                    this.ding(x);
                    console.log('DING');
                    this.applyState(this.cellBuff, x, y + 1, States.DOWN);
                }
                else {
                    this.applyState(this.cellBuff, x, y - 1, States.UP);
                }
            }

            if (cell.state & States.DOWN) {
                if (y >= this.size - 1) {
                    this.ding(x);
                    console.log('DING');
                    this.applyState(this.cellBuff, x, y - 1, States.UP);
                }
                else {
                    this.applyState(this.cellBuff, x, y + 1, States.DOWN);
                }
            }


            if (cell.state & States.LEFT) {
                if (x == 0) {
                    this.ding(y);
                    console.log('DING');
                    this.applyState(this.cellBuff, x + 1, y, States.RIGHT);
                } else {
                    this.applyState(this.cellBuff, x - 1, y, States.LEFT);
                }
            }

            if (cell.state & States.RIGHT) {
                if (x >= this.size - 1) {
                    this.ding(y);
                    console.log('DING');
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

        this.render();

        setTimeout(() => {
            this.update();
        }, this.speed);
    }

    render() {
        for (let i = 0; i < this.cells.length; ++i) {
            let cell = this.cells[i];

            let cellEl = this.grid.children[i];
            cellEl.classList.value = 'cell';

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

    ding(note) {
        let scale = ['c5', 'd5', 'e5', 'f5', 'g5', 'a6', 'b6', 'c6', 'd6'];
        let str = scale[note];
        
        let aud = new Audio(`audio/scale/${str}.ogg`);
        aud.autoplay = true;
    }

    preload() {
        let scale = ['c5', 'd5', 'e5', 'f5', 'g5', 'a6', 'b6', 'c6', 'd6'];

        scale.forEach(() => {
            let str = scale[note];

            let aud = new Audio(`audio/scale/${str}.ogg`);
            aud.autoplay = false;
        });
    }

}

new App();