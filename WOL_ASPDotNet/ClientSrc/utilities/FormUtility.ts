import * as lodash from 'lodash';

export const defaultNull = (val: any) => {
    if (lodash.isString(val) && lodash.isEmpty(val)) {
        return null;
    }
    return val;
}

export const removeEmptyFields = (data: any) => {
    Object.keys(data).forEach(key => {
        if (data[key] === '' || data[key] == null) {
            delete data[key];
        }
    });
}

export const submitForm = (url:string, data: any, target: string) => {
    const newForm = document.createElement('form');
    newForm.method = 'POST';
    newForm.action = url;
    newForm.target = target;


    lodash.forEach(data, (value, key) => {
        const input = document.createElement('input');
        input.type = "hidden";
        input.name = key;
        input.value = value;
        newForm.appendChild(input);
    });

    document.body.appendChild(newForm);

    newForm.submit();

    document.body.removeChild(newForm);
}