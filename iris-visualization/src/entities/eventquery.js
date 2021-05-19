export default class EventQuery{
    /**
     * @param {String} id
     * @param {Array<String>} fields 
     * @param {Function} cond 
     * @param {Array<Function>} values 
     * @param {String} type 
     * @param {boolean} stateless
     * @param {Function?} verify
     */
    constructor(id = "none", fields, cond, values, type, stateless, verify = null){
        this.id = id;
        this.fields = fields;
        this.cond = cond;
        this.values = values;
        this.type = type;
        this.stateless = stateless;
        this.verify = verify;
    }
}