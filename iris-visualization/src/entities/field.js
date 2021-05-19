import consts from './../consts';

let fields = consts.fields;

export default class Field{
    constructor(binField, rangeField, xField, yField, colorField){
        this[fields.binField] = binField;
        this[fields.rangeField] = rangeField;
        this[fields.xField] = xField;
        this[fields.yField] = yField;
        this[fields.colorField] = colorField;
    }
}