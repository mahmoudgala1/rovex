
export const validateAllowedUpdates = <T extends object>(body: T, allowedFields: string[]): Partial<T> => {
    const updateKeys = Object.keys(body);
    
    const invalidFields = updateKeys.filter((key) => !allowedFields.includes(key));

    if (invalidFields.length > 0) {
        throw new Error(`Invalid update fields: ${invalidFields.join(', ')}`);
    }

    const updates: any = {};
    updateKeys.forEach((key) => {
        updates[key] = (body as any)[key];
    });

    return updates;
};