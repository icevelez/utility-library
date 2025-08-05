import { createObject, object, string } from "./validtype.js";

const test = createObject({
    name: "hello world"
}, object({
    name: string()
}))

console.log(test.name);
test.name = "hello";
console.log(test.name);
test.name = "h";
console.log(test.name);
console.log(test.example_property);
