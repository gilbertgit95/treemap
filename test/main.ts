import Treemap from './../src/treemap'

let container_id = 'treemap',
    width: number = 1000,
    height: number = 500,
    isEqual: boolean = true,
    arry_of_data: any = [
        {
            label: 'one',
            value: 2,
            captions: ['good', 'bad', 'mixin'],
            color: 'gray'
        },
        {
            label: 'one',
            value: 3,
            captions: ['good', 'bad', 'mixin'],
            color: 'gray'
        }
    ];

let myTree: Treemap = new Treemap()

 window.onload = () => {
    myTree.init(
        container_id,
        width,
        height,
        arry_of_data,
        isEqual
    )
 }