/**
 * @template {any} T
 */
export class SafeValue {

    /**
     * @type {T}
     */
    value;

    /**
     * @type {string|null}
     */
    error = null;

    /**
     * @param {T} value
     * @param {any} error
     */
    constructor(value, error) {
        this.value = value;
        this.error = error && typeof error !== "string" ? error.toString() : error;
    }
}

/**
 * @template {any} T
 * @param {Promise<T>} promise
 * @return {Promise<SafeValue<T>>}
 */
export async function safePromise(promise) {
    try {
        if (!(promise instanceof Promise)) return new SafeValue(null, "input is not a promise")
        const result = await promise;
        if (result instanceof SafeValue) return result
        return new SafeValue(result, null)
    } catch (error) {
        return new SafeValue(null, error.toString())
    }
}

/**
 * @template {any} T
 * @param {() => T} callback
 * @return {SafeValue<T>}
 */
export function safeCallback(callback) {
    try {
        if (typeof callback !== "function") throw new SafeValue(null, "callback is not a function")
        const result = callback();
        if (result instanceof Promise) throw new Error("async callback is not allowed. use \"safePromise()\" instead");
        if (result instanceof SafeValue) return result
        return new SafeValue(result, null)
    } catch (error) {
        return new SafeValue(null, error.toString())
    }
}

/**
 * @template {any} T
 * @param {() => Promise<T>} callback
 * @return {Promise<SafeValue<T>>}
 */
export async function safePromiseCallback(callback) {
    try {
        if (typeof callback !== "function") throw new SafeValue(null, "callback is not a function")
        const result = await callback();
        if (result instanceof SafeValue) return result
        return new SafeValue(result, null)
    } catch (error) {
        return new SafeValue(null, error.toString())
    }
}

/**
 * @param {string} data
 */
export function safeJSONParse(data) {
    try {
        return new SafeValue(JSON.parse(data), null)
    } catch (error) {
        return new SafeValue(null, error.toString())
    }
}
