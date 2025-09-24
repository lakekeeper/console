import type { StructField } from '../gen/iceberg/types.gen';

// Types
export interface TreeItem {
  id: number;
  title: string;
  datatype: string;
  required: boolean;
  children?: TreeItem[];
}

// Helper functions for schema transformation
export const isStructType = (type: any): type is { type: 'struct'; fields: StructField[] } => {
  return type && type.type === 'struct' && Array.isArray(type.fields);
};

export const isListType = (type: any): type is { type: 'list'; element: any } => {
  return type && type.type === 'list' && type.element;
};

export const transformFields = (fields: StructField[]): TreeItem[] => {
  return fields.map((field) => {
    let title = field.name;
    let datatype = typeof field.type === 'string' ? field.type : '';

    if (typeof field.type === 'object') {
      if (isStructType(field.type)) {
        datatype = 'struct';
      } else if (isListType(field.type)) {
        datatype = 'array';
      }
    }
    title = `${title} (${datatype})`;

    const item: TreeItem = {
      id: field.id,
      title,
      datatype,
      required: field.required,
    };

    if (typeof field.type === 'object') {
      if (isStructType(field.type)) {
        item.children = transformFields(field.type.fields);
      } else if (isListType(field.type) && isStructType(field.type.element)) {
        item.children = transformFields(field.type.element.fields);
      }
    }

    return item;
  });
};
