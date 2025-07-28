/*
    Version: 0.0.2 - I don't know, I just made this, not sure if this will be touched again
    *Yeah you did touch it again

    Author: Iceberg Velez
    Email Address: icevelezdev@gmail.com
    Created at: May 08, 2025
    Edited  at: July 28, 2025

    I made this as an attempt to build my own implementation of valibot/zod in JSDoc

    Changelog:
        July 28, 2025: renamed "ValidType" to "TypeAssert"
*/

/**
* @template {any} T
*/
class TypeAssert {

    /**
    * array of callbacks to validate custom type
    * @type {Set<(_:T) => void>}
    */
    #callbacks = new Set();
    #is_optional = false;

    /**
    * @param {((_:T) => void)[]} args
    */
    #addCallbacks = (...args) => {
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] !== "function") throw new TypeError(`args[${i}] is not a function`);
            this.#callbacks.add(args[i])
        }
    };

    /**
    * @param  {((_:T) => void)[]} args
    */
    constructor(...args) {
        this.#addCallbacks(...args);
    }

    /**
    * return void if passed, throw an error if not
    * @param {(input:T) => void} callback
    */
    pipe(callback) {
        if (typeof callback !== "function") throw new TypeError("callback is not a function");
        this.#callbacks.add(callback);
        return this;
    }

    optional() {
        this.#is_optional = true;
        return this;
    }

    /**
    * @param {T} input
    */
    validate(input) {
        if (this.#is_optional && (input === null || input === undefined)) return;

        try {
            for (const callback of this.#callbacks) callback(input);
        } catch (error) {
            return `${error.toString()}`;
        }
    }

    /**
    * Access internal function for whatever purpose you see fit.
    * I used it to make it easier to implement `union()`
    */
    raw() {
        return {
            addCallbacks: this.#addCallbacks,
            callbacks: this.#callbacks,
            is_optional: this.#is_optional,
        }
    }
}

/**
* @type {() => TypeAssert<number>}
*/
export const number = () => new TypeAssert((i) => {
    if (!isNaN(i) && (i >= 0 || i <= 0) && typeof i === "number") return;
    throw new TypeError("not a number");
});

/**
* @type {() => TypeAssert<string>}
*/
export const string = () => new TypeAssert((i) => {
    if ((i || i === "") && typeof i === "string") return;
    throw new TypeError("not a string");
});

/**
* @type {() => TypeAssert<Boolean>}
*/
export const boolean = () => new TypeAssert((i) => {
    if (i && typeof i === "boolean") return;
    throw new TypeError("not a boolean");
});

/**
* @type {() => TypeAssert<Function>}
*/
export const func = () => new TypeAssert((i) => {
    if (i && typeof i === "function") return;
    throw new TypeError("not a function");
});

/**
* @type {() => TypeAssert<Date>}
*/
export const date = () => new TypeAssert((i) => {
    if (typeof i === "string") i = new Date(i);
    if (i.toDateString() !== "Invalid Date" && i instanceof Date) return;
    throw new TypeError("not an instance of \"Date\"");
});

/**
* @template {any} T
* @param {TypeAssert<T>} type
* @returns {TypeAssert<T[]>}
*/
export const array = (type) => {
    if (!(type instanceof TypeAssert)) throw new Error("input parameter is not an instance of \"TypeAssert\"");
    return new TypeAssert((a) => {
        if (a && Array.isArray(a) && a.every((a1) => typeof type.validate(a1) !== "string")) return;
        throw new TypeError("input is an invalid array")
    });
}

/**
* @template {any} T
* @param {TypeAssert<T>} type
* @returns {TypeAssert<Record<string, T>>}
*/
export const record = (type) => {
    if (!(type instanceof TypeAssert)) throw new Error("input parameter is not an instance of \"TypeAssert\"");
    return new TypeAssert((r) => {
        if (!r) throw new TypeError("input is an invalid record type")
        for (const key in r) {
            const error = type.validate(r[key])
            if (error) throw new TypeError(error);
        }
    });
}

/**
* @template {any} T
* @param {{ [K in keyof T]: TypeAssert<T[K]> }} schema
* @returns {TypeAssert<{ [K in keyof T]: T[K] }>}
*/
export function object(schema) {
    const schema_keys = new Set(Object.keys(schema));
    return new TypeAssert((data) => {
        for (let key in data) {
            if (schema_keys.has(key)) schema_keys.delete(key);
            if (!(schema[key] instanceof TypeAssert)) throw new Error(`schema at key ${key} is not an instance of \"TypeAssert\"`);
            if (!schema[key]) throw new TypeError(`data.${key} is not in your schema defintion`);
            const has_error = schema[key].validate(data[key]);
            if (has_error) throw new TypeError(`"${key}" ${has_error}`);
        }
        if (schema_keys.size > 0) throw new TypeError(`object has missing property. ${JSON.stringify(Array.from(schema_keys))}`);
        return null;
    })
};

/**
 * @template {any} T
 * @param {Array<T>} array
 * @returns {TypeAssert<T extends TypeAssert<infer U> ? U : never>}
 */
function unionX(array) {
    if (!Array.isArray(array)) throw new Error("input is not an array");
    if (!array.some((i) => i instanceof TypeAssert)) throw new Error("some type are not valid TypeAssert");
    const union = new TypeAssert();
    for (const type of array) union.raw().addCallbacks(type.raw().callbacks);
    return union;
}
