/* tslint:disable */
/* eslint-disable */
/**
 * Deplio
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 2024-02-26
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * 
 * @export
 * @enum {string}
 */
export enum ModelHTTPMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    PATCH = 'PATCH'
}


export function ModelHTTPMethodFromJSON(json: any): ModelHTTPMethod {
    return ModelHTTPMethodFromJSONTyped(json, false);
}

export function ModelHTTPMethodFromJSONTyped(json: any, ignoreDiscriminator: boolean): ModelHTTPMethod {
    return json as ModelHTTPMethod;
}

export function ModelHTTPMethodToJSON(value?: ModelHTTPMethod | null): any {
    return value as any;
}
