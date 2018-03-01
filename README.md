# treemap
a treemap generator for web apps
_Hi there :)_

_hope this library will be helpful to your project._

***

## getting started

**first:**

   _link the library on your html_

   `<script type="text/javascript" src="lib/treemap.js"></script>`

**second:**

   _create element where you want the image generated to be placed_

   _**note**: id is a must!_
  
   `<div id="treemap"></div>`

**third:**

  _initiate the lib with data_

  _this will automatically insert elements and generate the initial image_

  _**note**: id of element, array of data, width, height, partitioning type is a must!_

     `var myTree = new Treemap();`

         `myTree.init( container_id, width, height, arry_of_data, isEqual);`


  _the init above is enough to generate the treemap_

  _but the format of data should follow the below structure_

  _heres the complete example:_


     `var container_id = 'treemap',

        width = 1000,

        height = 500,

        isEqual = true,

        arry_of_data = [

        {

          label: 'one'

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

     // create treemap instance

     var myTree = new Treemap();
     
     // initiate treemap data

         myTree.init(

            container_id,

             width,

             height,

             arry_of_data,

             isEqual

         );`
   
 **hope this helps :) thanks**