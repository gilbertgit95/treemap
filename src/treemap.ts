// the core off treemap where computation takes place
class TreemapCore {
    private sortData(data: any) {
        let newData: any = data

        newData = data.sort((a: any, b: any) => {
            if (a.value === b.value) {
                return 0
            } else {
                return b.value - a.value
            }
        })

        return newData
    }

    private tableDim(cells: number, rows: number, width: number, height: number) {

        let cols:       number = 1,
            numOfCells: number

        for (let i:number = 0; i < cells; i++) {

            cols = i + 1
            numOfCells = cols * rows

            if (numOfCells >= cells) {
                break
            }
        }

        return {
            cols: cols,
            rows: rows,
            emptyCells: numOfCells - cells,
            cellWidth: width / cols,
            cellHeight: height / rows
        }
    }

    private getBestSample(numOfSamples: number, entries: any) {

        let samples = entries.sort((a: any, b: any) => {
                return a.hwDiff - b.hwDiff
            })

            samples.splice(numOfSamples, samples.length)

            samples = samples.sort((a: any, b: any) => {
                return a.emptyCells - b.emptyCells
            })

        return samples.splice(0, 1)
    }

    private bufferize(entries: any, model: any, width: number, height: number) {
        let items:      any = entries,
            converted:  any = [],
            row:        number,
            col:        number,
            x:          number,
            y:          number

        // push dummy entries
        for (let i: number = 0; i < model.emptyCells; i++) {
            items.push({
                label: '',
                color: '#D9D9D9',
                value: 10
            })
        }

        for (let i: number = 0; i < items.length; i++) {

            // detect witch row
            row = Math.floor(i / model.cols)
            col = i % model.cols

            // push computed data
            converted.push({
                entries: [items[i]],
                h: model.cellHeight,
                w: model.cellWidth,
                x: col * model.cellWidth,
                y: row * model.cellHeight,
                area: model.cellHeight * model.cellWidth
            })
        }

        return converted
    }

    private partitionEqual(width: number, height: number, arry: any) {
        let mainVars: any = {
                entries: arry,
                width: width,
                height: height,
                loop: true
            },
            sampleCell: any = {
                recentChange: 0,
                currentChange: 0
            },
            table: any = {
                cols: 0,
                rows: 1,
                cellWidth: 0,
                cellHeight: 0,
                emptyCells: 0,
                hwDiff: 0
            },
            samples = [],
            dimension

        // initiation
        table.cellWidth = mainVars.width / mainVars.entries.length
        table.cellHeight = mainVars.height
        sampleCell.currentChange = Math.abs(
            table.cellWidth - table.cellHeight
        )

        table.cols = mainVars.entries.length
        table.rows = 1
        table.emptyCells = 0

        // testing table
        for (let i: number = 0; i < mainVars.entries.length; i++) {
            let tempTable = this.tableDim(
                    mainVars.entries.length,
                    i + 1,
                    mainVars.width,
                    mainVars.height
                )

            table = {
                cols: tempTable.cols,
                rows: tempTable.rows,
                emptyCells: tempTable.emptyCells,
                cellWidth: tempTable.cellWidth,
                cellHeight: tempTable.cellHeight
            }

            sampleCell.recentChange = sampleCell.currentChange
            sampleCell.currentChange = Math.abs(table.cellWidth - table.cellHeight)

            table.hwDiff = sampleCell.currentChange
            samples.push(table)
        }

        dimension = this.getBestSample(5, samples)

        return this.bufferize(mainVars.entries, dimension[0], width, height)
    }

    private partition(parent: any) {
        let fChild: any = {
                entries: null,
                x: parent.x,
                y: parent.y,
                w: null,
                h: null,
                area: null,
                total: null
            },
            sChild: any = {
                entries: null,
                x: null,
                y: null,
                w: null,
                h: null,
                area: null,
                total: null,
            },
            partitionIndex: number,
            sum: number

        // find partition index
        sum = 0
        for (let i: number = 0; i < parent.entries.length; i++) {
            sum += parent.entries[i].value
            if (sum > (parent.total / 2)) {
                if (i <= 0) {
                    partitionIndex = 0
                } else if (
                    (sum-(parent.total / 2)) >
                    ((parent.total / 2) - (sum - parent.entries[i].value)))
                {
                    partitionIndex = i - 1
                } else {
                    partitionIndex = i
                }
                break
            }
        }

        // find area and total
        sum = 0
        for (let i: number = 0; i < partitionIndex + 1; i++) {
            sum += parent.entries[i].value
        }
        fChild.total = sum
        fChild.area = (sum / parent.total) * parent.area

        sChild.total = parent.total - sum
        sChild.area = parent.area - fChild.area

        // find the partition layout; assign size and position
        if (parent.w >= parent.h) {
            // vertical
            fChild.w = fChild.area / parent.h
            fChild.h = parent.h

            sChild.w = parent.w - fChild.w
            sChild.h = parent.h
            sChild.x = fChild.x + fChild.w
            sChild.y = fChild.y
        } else {
            // horizontal
            fChild.w = parent.w
            fChild.h = fChild.area / parent.w

            sChild.w = parent.w
            sChild.h = parent.h - fChild.h
            sChild.x = fChild.x
            sChild.y = fChild.y + fChild.h
        }

        // partition parent
        fChild.entries = parent.entries.splice(0, partitionIndex + 1)
        sChild.entries = parent.entries

        return [fChild, sChild]
    }

    private decompose(width: number, height: number, data: any, equal: boolean) {
        let partitions: any = [],
            dataTotal:  number = 0,
            dataEntries:any = data,
            tempIndex:  number,
            option:     boolean = false

        if (equal) {
            option = equal
        }

        function isBreakable() {
            let breakable:  boolean = false,
                breakIndex: number

            for (let i: number = 0; i < partitions.length; i++) {
                if (partitions[i].entries.length > 1) {
                    breakable = true
                    breakIndex = i
                    break
                }
            }
            tempIndex = breakIndex

            return breakable
        }

        function breakAPart(i: number, self: any) {
            let parent: any,
                children: any

            parent = partitions[i]
            children = self.partition(parent)

            partitions.push(children[0])
            partitions.push(children[1])

            partitions.splice(i, 1)
        }

        if (!option) {
            // clean the entries
            for (let i: number = 0; i < dataEntries.length; i++) {
                if (dataEntries[i].value <= 0) {
                    dataEntries.splice(i, 1)
                }
            }

            for (let i: number = 0; i < dataEntries.length; i++) {
                dataTotal += dataEntries[i].value
            }

            // initiate parent entries
            partitions.push({
                entries: dataEntries,
                x: 0,
                y: 0,
                w: width,
                h: height,
                total: dataTotal,
                area: width * height
            })

            while(isBreakable()) {
                breakAPart(tempIndex, this)
            }
        } else {
            partitions = this.partitionEqual(width, height, dataEntries)
        }

        return partitions
    }

    public generate(width: number, height: number, data: any, equal: boolean) {
        let sortedData: any,
            option:     boolean = false

        if (equal) {
            option = equal
        }

        if (equal) {
            sortedData = data
        } else {
            sortedData = this.sortData(data)
        }

        return this.decompose(width, height, sortedData, option)
    }
}

// responsible for showing the visible table
class TreemapMain {
    // internal letiables
    private buffer:             any
    private childBuffer:        any
    private self:               any
    private canv:               any
    private width:              number
    private height:             number
    private play:               boolean = false
    private tipsAlwaysVisible:  boolean = false
    private equalpartition:     boolean = true
    private core:               any = null
    private mouse:              any = {
            click: {
                x: -5,
                y: -5
            },
            hover: {
                x: null,
                y: null
            }
        }
    
    private updateBuffers(w: number, h: number, data: any) {
        this.childBuffer = []
        this.buffer = []

        this.buffer = this.core.generate(w, h, data, this.equalpartition)

        for (let i: number = 0; i < this.buffer.length; i++) {
            if (this.buffer[i].entries[0].children) {

                let temp = this.core.generate(
                        this.buffer[i].w,
                        this.buffer[i].h,
                        this.buffer[i].entries[0].children
                    ),
                    addX = this.buffer[i].x,
                    addY = this.buffer[i].y

                for (var j = 0; j < temp.length; j++) {
                    temp[j].x += addX
                    temp[j].y += addY
                    this.childBuffer.push(temp[j])
                }
            }
        }
    }

    private setDrawboard(id: string, w: number, h: number, data: any) {
        this.core = new TreemapCore()

        this.width = w
        this.height = h
        this.self = document.getElementById(id)
        this.canv = this.self.getContext('2d')
        this.updateBuffers(w, h, data)
    }

    private clear() {
        this.canv.clearRect(0, 0, this.width, this.height);
    }

    private drawParentRects() {
        for (let i: number = 0; i < this.buffer.length; i++) {
            let textX = 15,
                textY = 20

            this.canv.beginPath()
            // this.canv.save();
            this.canv.lineWidth = 0.25
            this.canv.strokeStyle = 'white'

            // draw rect
            this.canv.fillStyle = this.buffer[i].entries[0].color
            this.canv.fillRect(
                this.buffer[i].x,
                this.buffer[i].y,
                this.buffer[i].w,
                this.buffer[i].h
            )
            this.canv.strokeRect(
                this.buffer[i].x,
                this.buffer[i].y,
                this.buffer[i].w,
                this.buffer[i].h
            )

            this.canv.stroke()
            this.canv.fill()

            // draw label
            this.canv.fillStyle = 'white'
            if (this.buffer[i].entries[0].label) {
                this.canv.font = 'bold 14px arial'

                let textLength = this.canv.measureText(this.buffer[i].entries[0].label)
                if((textLength["width"] + (textX)) > (this.buffer[i].w - textX)){
                    // console.log(this.buffer[i].entries[0].label);

                    // identify devisions
                    let count = this.wrapText(
                        this.canv,
                        this.buffer[i].entries[0].label,
                        (this.buffer[i].x + textX),
                        (this.buffer[i].y + textY),
                        (this.buffer[i].w - textX),
                        15
                    )
                    textY += (count * 15)
                }
                else{
                    this.canv.fillText(
                        this.buffer[i].entries[0].label,
                        this.buffer[i].x + textX,
                        this.buffer[i].y + textY
                    )
                }

                this.canv.fill()
                textY += 15
            }
            if (this.buffer[i].entries[0].captions) {
                for (var j = 0; j < this.buffer[i].entries[0].captions.length; j++) {
                    this.canv.fillStyle = 'white'
                    this.canv.font = 'normal 11px arial'

                    let textLength = this.canv.measureText(this.buffer[i].entries[0].captions[j])
                    if((textLength["width"] + (textX)) > (this.buffer[i].w - textX)){

                        // identify devisions
                        let count = this.wrapText(
                            this.canv,
                            this.buffer[i].entries[0].captions[j],
                            (this.buffer[i].x + textX),
                            (this.buffer[i].y + textY),
                            (this.buffer[i].w - textX),
                            15
                        )
                        textY += (count * 15)
                    }
                    else{
                        this.canv.fillText(
                            this.buffer[i].entries[0].captions[j],
                            this.buffer[i].x + textX,
                            this.buffer[i].y + textY
                        )
                    }

                    this.canv.fill()
                    textY += 15
                }
            }

            //this.canv.restore();
            this.canv.closePath()
        }
    }

    private wrapText (context: any, text: any, x: number, y: number, maxWidth: number, lineHeight: number) {
        let words:      any = text.split(' '),
            line:       any = '',
            lineCount:  number = 0,
            test:       any,
            metrics:    any

        for (let i: number = 0; i < words.length; i++) {
            test = words[i]
            metrics = context.measureText(test)
            while (metrics.width > maxWidth) {
                // Determine how much of the word will fit
                test = test.substring(0, test.length - 1)
                metrics = context.measureText(test)
            }
            if (words[i] != test) {
                words.splice(i + 1, 0,  words[i].substr(test.length))
                words[i] = test
            }

            test = line + words[i] + ' '
            metrics = context.measureText(test)

            if (metrics.width > maxWidth && i > 0) {
                context.fillText(line, x, y)
                line = words[i] + ' '
                y += lineHeight
                lineCount++
            }
            else {
                line = test
            }
        }

        context.fillText(line, x, y)
        return lineCount
    }

    private drawChildRects() {
        for (let i: number = 0; i < this.childBuffer.length; i++) {
            this.canv.beginPath()
            this.canv.lineWidth = 0.25
            this.canv.strokeStyle = 'white'

            this.canv.strokeRect(
                this.childBuffer[i].x,
                this.childBuffer[i].y,
                this.childBuffer[i].w,
                this.childBuffer[i].h
            )

            this.canv.stroke()
            this.canv.closePath()
        }
    }

    private drawHover(i: number) {
        let textX: number = 15,
            textY: number = 20,
            textColor: string = 'rgba(255, 255, 255, 0.4)'

        try {
            this.canv.beginPath()
            this.canv.fillStyle = 'rgba(0, 0, 0, 0.1)'
            this.canv.fillRect(
                this.buffer[i].x,
                this.buffer[i].y,
                this.buffer[i].w - 1,
                this.buffer[i].h - 1
            )
            this.canv.stroke()
            this.canv.fill()
            this.canv.closePath()
        } catch (err) {
            // console.log('minor error')
        }
    }

    private drawClick() {
        let index = this.cursorOverThis(this.mouse.click.x, this.mouse.click.y)
        try {
            this.canv.beginPath()
            this.canv.fillStyle = 'rgba(0, 0, 0, 0.2)'
            this.canv.fillRect(
                this.buffer[index].x,
                this.buffer[index].y,
                this.buffer[index].w,
                this.buffer[index].h
            )
            this.canv.stroke()
            this.canv.fill()
            this.canv.closePath()
        } catch (err) {
            // console.log('minor error');
        }
    }

    private drawTips() {
        let recTooSmall:    boolean = false,
            visibleWidth:   number = 100,
            visibleHeight:  number = 50,
            x:              number = this.mouse.hover.x,
            y:              number = this.mouse.hover.y,
            hoverIndex:     number = this.cursorOverThis(x, y),
            tipWidth:       number = 300,
            tipHeight:      number = 100,
            margin:         number = 20,
            padding:        number = 10,

            backColor:      string = 'rgba(255, 255, 255, 0.9)',
            shadowColor:    string = 'rgba(0, 0, 0, 0.4)',
            shadowBlur:     number = 20,
            lineSpace:      number = 15,

            fontColor:      string = 'black',

            fx:             number,
            fy:             number, // rect points

            lx:             number,
            ly:             number,

            ax:             number,
            ay:             number,
            arrowWidth:     number = 20,

            tx:             number,
            ty:             number // text point

        try {
            if (
                this.buffer[hoverIndex].w < visibleWidth ||
                this.buffer[hoverIndex].h < visibleHeight
                ) {
                recTooSmall = true
            }
        } catch (err) {
            // console.log('[cursor not on the treemap]: ' + err)
        }

        function drawBox(self: any) {
            self.canv.beginPath()
            self.canv.shadowBlur = shadowBlur
            self.canv.shadowColor = shadowColor

            self.canv.moveTo(ax, fy)
            self.canv.lineTo(lx, fy)
            self.canv.lineTo(lx, ly)
            self.canv.lineTo(fx, ly)
            self.canv.lineTo(fx, ay)
            self.canv.lineTo(x, y)
            self.canv.lineTo(ax, fy)

            self.canv.fill()
            self.canv.closePath()
            self.canv.shadowBlur = 0
        }

        function drawText(index: number, self: any) {
            let textY = ty

            self.canv.beginPath()
            if (self.buffer[index].entries[0].label) {
                self.canv.fillStyle = fontColor
                self.canv.font = 'bold 14px arial'

                let textLength: any = self.canv.measureText(self.buffer[index].entries[0].label)
                if(textLength["width"] > 290){
                    // console.log(self.buffer[i].entries[0].label);

                    // identify devisions
                    let count: number = self.wrapText(
                        self.canv,
                        self.buffer[index].entries[0].label,
                        tx,
                        textY,
                        920,
                        15
                    )

                    textY += count * 15
                }
                else{
                    self.canv.fillText(
                        self.buffer[index].entries[0].label,
                        tx,
                        textY
                    );
                }

                self.canv.fill()
                textY += lineSpace
            }
            if (self.buffer[index].entries[0].captions) {
                self.canv.fillStyle = fontColor
                for (let j: number = 0; j < self.buffer[index].entries[0].captions.length; j++) {
                    self.canv.font = 'normal 11px arial'

                    let textLength = self.canv.measureText(self.buffer[index].entries[0].captions[j])
                    if(textLength["width"] > 290){
                        // console.log(self.buffer[i].entries[0].label)

                        // identify devisions
                        let count = self.wrapText(
                            self.canv,
                            self.buffer[index].entries[0].captions[j],
                            tx,
                            textY,
                            290,
                            15
                        )

                        textY += count * 15
                    }
                    else{
                        self.canv.fillText(
                            self.buffer[index].entries[0].captions[j],
                            tx,
                            textY
                        )
                    }

                    textY += lineSpace
                    self.canv.fill()
                }
            }
            self.canv.closePath()
        }

        function calculatePos(self: any) {
            // manipulate x, y position
            if (x < (self.width - margin - tipWidth)) {
                fx = x + margin
                lx = fx + tipWidth
                ax = fx + arrowWidth
                tx = fx + padding
            } else {
                fx = x - margin
                lx = fx - tipWidth
                ax = fx - arrowWidth
                tx = lx + padding
            }

            if (y < (self.height - margin - tipHeight)) {
                fy = y + margin
                ly = fy + tipHeight
                ay = fy + arrowWidth
                ty = fy + padding + 10
            } else {
                fy = y - margin
                ly = fy - tipHeight
                ay = fy - arrowWidth
                ty = ly + padding + 10
            }
        }

        if (this.tipsAlwaysVisible || recTooSmall) {

            this.canv.fillStyle = backColor
            calculatePos(this)
            drawBox(this)
            try {
                drawText(hoverIndex, this)
            } catch (err) {
                // console.log('error in drawing text')
            }
        }
    }

    private cursorOverThis(x: number, y: number) {
        let out
        for (let i: number = 0; i < this.buffer.length; i++) {
            if( // x pos
                this.buffer[i].x <= x &&
                x <= (this.buffer[i].x + this.buffer[i].w) &&
                // y pos
                this.buffer[i].y <= y &&
                y <= (this.buffer[i].y + this.buffer[i].h)
            ) {
                out = i
                break
            }
        }
        return out
    }

    private render() {
        setTimeout(() => {
            if (this.play) {
                this.clear();
                this.drawParentRects();
                this.drawChildRects();
                this.drawHover(this.cursorOverThis(
                    this.mouse.hover.x,
                    this.mouse.hover.y
                ));
                this.drawClick();
                this.drawTips();
                this.render();
            }
        }, 20);
    }

    public setPlay(p: boolean) {
        this.play = p
        this.render()
    }

    public tipAlwaysVisible(value: boolean) {
        this.tipsAlwaysVisible = value
    }

    public setClickPos(x: number, y: number) {
        this.mouse.click.x = x
        this.mouse.click.y = y
    }

    public setHoverPos(x: number, y: number) {
        this.mouse.hover.x = x
        this.mouse.hover.y = y
    }

    public draw() {
        this.drawParentRects()
        this.drawChildRects()
    }

    public getCLickIndex() {
        return this.cursorOverThis(this.mouse.hover.x, this.mouse.hover.y)
    }

    public getClickedItem() {
        let selected: any = {
                parents: null,
                selected: null
            },
            parents: any = []

        for (let i: number = 0; i < this.buffer.length; i++) {
            parents.push(this.buffer[i].entries[0])
        }
        selected.parents = parents
        selected.selected = this.buffer[this.cursorOverThis(this.mouse.hover.x, this.mouse.hover.y)].entries[0]

        return selected
    }

    public getBuffers() {
        return {
            'parent': this.buffer,
            'child': this.childBuffer
        }
    }

    public updateData(data: any, isEqual: boolean) {
        this.mouse.click.x = -5
        this.mouse.click.y = -5
        this.equalpartition = isEqual

        this.updateBuffers(this.width, this.height, data)
        this.drawParentRects()
        this.drawChildRects()
    }

    public init(id: string, w: number, h: number, data: any, isEqual: boolean) {
        this.equalpartition = isEqual
        this.setDrawboard(id, w, h, data)
        this.draw()
    }
}

// responsible for showing the transition effect
class TreemapTransition {
    // internal variables
    private buffer: any
    private childBuffer: any
    private self: any
    private canv: any
    private width: number
    private height: number
    private transitionTime: number = 2000
    private renderTime: number = 16  // deprecated

    private effects = 'fade' // transition effects
    private effectsDir = 'out'

    private play: boolean = false
    private origin: any = null // deprecated
    private centerIndex: number = null // deprecated
    private originItem: any = null // deprecated
    private speed: number = 15 // deprecated

    private resultW: number // data for transition // deprecated
    private resultH: number // deprecated

    private mouse: any = { // data from the mouse // deprecated
        click: {
            x: null,
            y: null
        }
    }
    private animation: any = {
        fade: function (direction: string) {
            if (direction === 'in') {
            //    console.log('fade in')
            } else if (direction === 'out') {
            //    console.log('fade out')
            }
        }
    }

    // expose variables

    // child object dependencies
    private core: any = null // deprecated

    private setStyle(el: any) {
        el.style.opacity = '0'
    }

    private setDrawboard(id: string, w: number, h: number) {
        this.core = new TreemapCore() // deprecated

        this.width = w
        this.height = h
        this.self = document.getElementById(id)
        this.canv = this.self.getContext('2d')
        this.setStyle(this.self)
    }

    private drawParentRects() {
        for (let i: number = 0; i < this.buffer.length; i++) {
            let textX: number = 15,
                textY: number = 20

            this.canv.beginPath()
            this.canv.lineWidth = 0.25
            this.canv.strokeStyle = 'white'

            // draw rect
            this.canv.fillStyle = this.buffer[i].entries[0].color
            this.canv.fillRect(
                this.buffer[i].x,
                this.buffer[i].y,
                this.buffer[i].w,
                this.buffer[i].h
            )
            this.canv.strokeRect(
                this.buffer[i].x,
                this.buffer[i].y,
                this.buffer[i].w,
                this.buffer[i].h
            )
            this.canv.stroke()
            this.canv.fill()

            // draw label
            if (this.buffer[i].entries[0].label) {
                this.canv.fillStyle = 'white'
                this.canv.font = 'bold 14px arial'
                this.canv.fillText(
                    this.buffer[i].entries[0].label,
                    this.buffer[i].x + textX,
                    this.buffer[i].y + textY
                )
                this.canv.fill()
                textY += 15
            }
            if (this.buffer[i].entries[0].captions) {
                for (let j: number = 0; j < this.buffer[i].entries[0].captions.length; j++) {
                    this.canv.fillStyle = 'white'
                    this.canv.font = 'normal 11px arial'
                    this.canv.fillText(
                        this.buffer[i].entries[0].captions[j],
                        this.buffer[i].x + textX,
                        this.buffer[i].y + textY
                    )
                    this.canv.fill()
                    textY += 15
                }
            }

            this.canv.closePath()
        }
    }

    private drawChildRects() {
        for (let i: number = 0; i < this.childBuffer.length; i++) {
            this.canv.beginPath()
            this.canv.lineWidth = 0.25
            this.canv.strokeStyle = 'white'

            this.canv.strokeRect(
                this.childBuffer[i].x,
                this.childBuffer[i].y,
                this.childBuffer[i].w,
                this.childBuffer[i].h
            )

            this.canv.stroke()
            this.canv.closePath()
        }
    }

    private clear() {
        this.canv.clearRect(0, 0, this.width, this.height)
    }

    private animate() {
        if (this.effects === 'fade') {
            this.animation.fade(this.effectsDir)
        }
    }

    private preAnimate() {
        this.self.style.opacity = 1
        this.play = true

        if (this.effects === 'fade') {

            setTimeout(() => {
                this.stop()
            }, 150)

            if (this.effectsDir === 'in') {
                this.self.style.opacity = 1
            }
            if (this.effectsDir === 'out') {
                this.self.style.opacity = 1
            }
        }
    }

    private render() {
        setTimeout(() => {
            if (this.play) {
                this.clear()
                this.drawParentRects()
                this.drawChildRects()
                this.animate()
                this.render()
            }
        }, this.renderTime)
    }

    public start() {
        this.drawParentRects()
        this.drawChildRects()
        this.self.style.transition = 'opacity 0s'
        this.preAnimate()
        this.render()
    }

    public stop() {
        this.self.style.transition = 'opacity .5s'
        this.self.style.opacity = 0
        this.play = false
    }

    public setPlay(p: boolean) {
        this.play = p
        this.render()
    }

    public setEffect(effec: string, effecDir: string) {
        this.effects = effec
        this.effectsDir = effecDir
    }

    public draw() {
        this.drawParentRects()
    }

    public updateData(data: any) {
        this.updateBuffers(data)
        this.drawParentRects()
        this.drawChildRects()
    }

    public updateBuffers(data: any) {
        this.buffer = data.parent
        this.childBuffer = data.child
    }

    public init(id: string, w: number, h: number) {
        this.setDrawboard(id, w, h)
    }
}

// responsible for managing the treemap computation and display
class Treemap {
    // internal properties
        // main variables
        private container: any = {
            self,
            width: null,
            height: null,
            id: {
                self: null,
                main: null,
                transition: null,
                tips: null
            },
            data: null
        }
        private offset: any = {
            class: 'treemap-offset',
            x: 0,
            y: 0
        }
        private mouse: any = {
            enable: true,
            click: {
                x: null,
                y: null
            },
            hover: {
                x: null,
                y: null
            }
        }

        // child objects dependencies
        public main = new TreemapMain()
        public transition = new TreemapTransition()

        private setDrawboard(width: any, height: any, id: string) {
            let mainId = id + Math.ceil(Math.random() * 1000000),
                transitionId = id + Math.ceil(Math.random() * 1000000),
    
                mainCanv = document.createElement('canvas'),
                transitionCanv = document.createElement('canvas')
    
                mainCanv.setAttribute('id', mainId)
                mainCanv.setAttribute('width', width)
                mainCanv.setAttribute('height', height)
                mainCanv.setAttribute('style', 'position:absolute;')
    
                transitionCanv.setAttribute('id', transitionId)
                transitionCanv.setAttribute('width', width)
                transitionCanv.setAttribute('height', height)
                transitionCanv.setAttribute('style', 'position:absolute;')
    
                this.container.self = document.getElementById(id)
    
                this.container.self.appendChild(mainCanv)
                this.container.self.appendChild(transitionCanv)
    
                this.container.id.main = mainId
                this.container.id.transition = transitionId
        }

        private setStyle(el: any) {
            el.style.cursor = 'pointer'
            el.style.position = 'relative'
        }

        private setEvents(el: any, mainChild: any, transitionChild: any) {
            el.addEventListener('click', (e: any) => {
                if (this.mouse.enable) {
                    this.mouse.click.x = e.clientX - this.offset.x
                    this.mouse.click.y = e.clientY - this.offset.y
    
                    mainChild.setClickPos( this.mouse.click.x, this.mouse.click.y)
                }
            })
            el.addEventListener('mousemove', (e: any) => {
    
                if (this.mouse.enable) {
    
                    this.mouse.hover.x = e.clientX - this.offset.x
                    this.mouse.hover.y = e.clientY - this.offset.y
    
                    mainChild.setHoverPos(this.mouse.hover.x, this.mouse.hover.y)
                }
            })
            el.addEventListener('mouseover', () => {
                if (this.mouse.enable) {
                    mainChild.setPlay(true)
                    mainChild.setClickPos(-5, -5)
                }
            })
            el.addEventListener('mouseout', () => {
                if (this.mouse.enable) {
                    mainChild.setPlay(false)
                    mainChild.draw()
                }
            })
            window.onresize = () => {
                this.setOffset()
            }
            window.onscroll = () => {
                this.setOffset()
            }
        }

        private setOffset() {
            let offsetX: number = 0,
                offsetY: number = 0,
                parents: any = []
    
            try {
                parents = document.getElementsByClassName(this.offset.class)
            } catch (err) {
                // console.log('no classname')
            }

            if (parents) {
                for (var i = 0; i < parents.length; i++) {
                    offsetX += parents[i].offsetLeft
                    offsetY += parents[i].offsetTop
                }
            }
    
            this.offset.x = offsetX - window.pageXOffset
            this.offset.y = offsetY - window.pageYOffset
        }

        public changeData(data: any, isEqual: boolean) {

            this.mouse.enable = false
            setTimeout(() => {
                this.mouse.enable = true
            }, 100)
    
            this.transition.updateBuffers(this.main.getBuffers())
            this.transition.start()
            setTimeout(this.main.updateData(data, isEqual), 100)
        }

        public getClickIndex() {
            return this.main.getCLickIndex()
        }

        public setOffsetClass(className: string) {
            this.offset.class = className
        }

        public init(id: string, width: number, height: number, data: any, isEqual: boolean) {
    
            this.container.width = width
            this.container.height = height
            this.container.id.self = id
            this.container.data = data
    
            this.setDrawboard(width, height, id)
            this.setStyle(this.container.self)
    
            this.main.init(this.container.id.main, width, height, data, isEqual)
            this.transition.init(this.container.id.transition, width, height)
    
            this.setEvents(
                this.container.self,
                this.main,
                this.transition
            )
    
            this.setOffset()
        }
}

export default Treemap