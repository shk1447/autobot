import { IResponse } from "@shared/interfaces/IResponse";
import HookService from "@app/src/services/HookService";
import {
  Get,
  Route,
  Post,
  Delete,
  Tags,
  Query,
  BodyProp,
  Example,
  Path,
  Put,
  Controller,
} from "tsoa";

export type Hook = {
  /**
   * 매크로의 실행키
   */
  uuid: string;
  /**
   * 매크로의 이름
   */
  name: string;
  /**
   * 매크로에 대한 스케쥴 설정값
   */
  cron: string[];
  /**
   * 매크로에 대한 아웃풋 이미지들
   */
  path: {
    /**
     * 매크로 저장결과 폴더경로
     */
    directory: string;
    /**
     * 매크로 생성 당시에 결과 이미지 경로
     */
    base: string;
    /**
     * 매크로 실행 후 결과 이미지 경로
     */
    actual: string;
    /**
     * 매크로 실행 결과과 생성 결과를 비교한 이미지 경로
     */
    diff: string;
  };
  result: {
    percentage: number;
  };
};

/**
 * 매크로 관련 API
 */
@Route("hook")
@Tags("Hook")
export class HookController extends Controller {
  /**
   * 매크로 리스트를 반환해주는 API
   * @returns
   */
  @Get("load")
  public async load(): Promise<IResponse<Hook[], any>> {
    const result = HookService.load();
    return {
      message: "",
      result: Object.values(result.list),
      meta: {},
    };
  }

  /**
   * 현재 매크로의 동작 유/무를 반환해주는 API
   * @returns
   */
  @Get("play/state")
  public async playState(): Promise<IResponse<boolean, any>> {
    return {
      message: "",
      result: HookService.playing,
      meta: {},
    };
  }

  /**
   * 등록된 모든 매크로를 실행하는 API
   * @param sync 동기/비동기를 선택할 수 있는 옵션
   * @returns
   */
  @Get("play")
  public async playAll(
    @Query() sync: boolean
  ): Promise<IResponse<Hook[], any>> {
    sync
      ? await HookService.play(Object.keys(HookService.load().list))
      : HookService.play(Object.keys(HookService.load().list));
    return {
      message: "",
      result: Object.values(HookService.load().list),
      meta: {},
    };
  }

  /**
   * 매크로 단일실행 API
   * @param uuid 실행할 매크로 uuid
   * @param sync 비동기/동기 방식 옵션
   * @returns ㅅㅅㅅ
   */
  @Get("play/{uuid}")
  public async play(
    @Path() uuid: string,
    @Query() sync: boolean
  ): Promise<IResponse<Hook, any>> {
    sync ? await HookService.play([uuid]) : HookService.play([uuid]);
    return {
      message: "",
      result: HookService.load().list[uuid],
      meta: {},
    };
  }

  /**
   * 현재 설치된 장비의 스크린 캡쳐에 대한 base64를 제공하는 API
   * @returns
   */
  @Get("capture")
  public async capture(): Promise<IResponse<string, any>> {
    const ret = await HookService.capture();
    return {
      message: "",
      result: ret,
      meta: {},
    };
  }
}
