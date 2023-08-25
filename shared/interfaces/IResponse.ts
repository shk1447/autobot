export interface IResponse<T, M> {
  message: string;
  result: T;
  meta: M;
}
