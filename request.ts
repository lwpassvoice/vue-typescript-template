import { RequestFunctionParams, RequestBodyType } from 'yapi-to-typescript';

export enum RequestErrorType {
  NetworkError = 'NetworkError',
  StatusError = 'StatusError',
  BusinessError = 'BusinessError',
}

export class RequestError extends Error {
  constructor(
    public type: RequestErrorType,
    public message: any,
    public httpStatusOrBusinessCode: number = 0,
  ) {
    super(message instanceof Error ? message.message : String(message));
  }
}

export type CommonResponseType<T = any> = {
  data: T,
  msg: string,
  type: number,
}

export interface RequestOptions {
  /**
  * 是否需要登录
  */
   needLogin?: boolean,
  /**
   * 使用的服务器。
   *
   * - `prod`: 生产服务器
   * - `dev`: 测试服务器
   * - `mock`: 模拟服务器
   *
   * @default production
   */
  server?: 'production' | 'development' | 'mock',
  /**
   * 是否返回 Blob 结果，适用某些返回文件流的接口。
   */
  returnBlob?: boolean,
  /**
   * 是否自动重试
  */
  autoRetry?: boolean,
  /**
   * 自动重试次数限制
  */
  autoRetryLimit?: number,
}

export default async function request<T>(
  payload: RequestFunctionParams,
  options: RequestOptions = {
    needLogin: true,
    autoRetry: false,
  },
): Promise<CommonResponseType<T>> {
  try {
    const { VUE_APP_BUILD_ENV } = process.env;
    // 基础 URL
    let baseUrl;
    switch (options.server || VUE_APP_BUILD_ENV) {
      case 'mock': {
        baseUrl = process.env.VUE_APP_BASE_URL_MOCK;
        break;
      }
      case 'development': {
        baseUrl = process.env.VUE_APP_BASE_URL_DEV;
        break;
      }
      case 'testing': {
        baseUrl = process.env.VUE_APP_BASE_URL_TEST;
        break;
      }
      default: {
        baseUrl = process.env.VUE_APP_BASE_URL;
        break;
      }
    }

    const token = window.localStorage.token || '';
    // 请求地址
    const url = `${baseUrl}${payload.path}`;

    // fetch 选项
    const fetchOptions: RequestInit = {
      // credentials: 'include',
      mode: 'cors',
      method: payload.method,
      /* eslint-disable no-nested-ternary */
      headers: {
        ...(payload.hasFileData
          ? {}
          : payload.requestBodyType === RequestBodyType.json
            ? { 'Content-Type': 'application/json; charset=UTF-8' }
            : payload.requestBodyType === RequestBodyType.form
              ? {
                'Content-Type':
                'application/x-www-form-urlencoded; charset=UTF-8',
              }
              : {}),
      },
      body: payload.hasFileData
        ? payload.getFormData()
        : payload.requestBodyType === RequestBodyType.json
          ? JSON.stringify(payload.data)
          : payload.requestBodyType === RequestBodyType.form
            ? Object.keys(payload.data)
              .filter((key) => payload.data[key] != null)
              .map(
                (key) => `${encodeURIComponent(key)}=${encodeURIComponent(
                  payload.data[key],
                )}`,
              )
              .join('&')
            : undefined,
      /* eslint-enable no-nested-ternary */
    };

    // 发起请求
    const [fetchErr, fetchRes] = await fetch(url, fetchOptions).then<
      [
        null,
        Response,
      ],
      [
        // 如果遇到网络故障，fetch 将会 reject 一个 TypeError 对象
        TypeError,
        undefined,
      ]
    >(
      (res) => [null, res],
      (err) => [err, undefined],
    );

    // 网络错误
    if (fetchErr) {
      throw new RequestError(RequestErrorType.NetworkError, fetchErr);
    }

    if (fetchRes && (fetchRes.status < 200 || fetchRes.status >= 300)) {
      throw new RequestError(
        RequestErrorType.StatusError,
        `${fetchRes.status}: ${fetchRes.statusText}`,
        fetchRes.status,
      );
    } else if (fetchRes) {
      const res = await fetchRes.json();
      switch (res.type) {
        case 200: {
          return res;
        }
        case 401: {
          throw res;
        }
        default: {
          throw res;
        }
      }
    }

    throw fetchErr;
  } catch (err: unknown) {
    if (err instanceof RequestError) {
      // 重试函数
      const retry = () => request<T>(payload, options);
      // TODO: 自动重试次数限制
      if (options.autoRetry) {
        return retry();
      }
      throw err;
    } else {
      throw err;
    }
  }
}
