import { defineConfig } from 'yapi-to-typescript';
import { splitStringWithReplacer } from './src/tools/tools';

export default defineConfig([
  {
    serverType: 'yapi',
    serverUrl: 'http://',
    typesOnly: false,
    target: 'typescript',
    reactHooks: {
      enabled: false,
    },
    devEnvName: 'development',
    prodEnvName: 'production',
    outputFilePath: (interfaceInfo, changeCase) => {
      const nameWithSpace = splitStringWithReplacer(interfaceInfo.query_path.path, 0, 2);
      return `src/api/${changeCase.camelCase(nameWithSpace)}.ts`;
    },
    requestFunctionFilePath: 'src/api/request.ts',
    dataKey: 'data',
    projects: [
      {
        token: '',
        categories: [
          {
            id: 0,
            getRequestFunctionName(interfaceInfo, changeCase) {
              return changeCase.camelCase(splitStringWithReplacer(interfaceInfo.path));
            },
          },
        ],
      },
    ],
  },
]);
