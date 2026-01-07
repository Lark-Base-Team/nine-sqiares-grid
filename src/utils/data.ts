import { bitable as bitableSdk, IGetRecordsByPageParams, IRecord } from "@lark-base-open/js-sdk";

function getIsMobile() {
  const ua = window.navigator.userAgent;
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(ua);
  return isMobile;
}

export async function loadTableRecords(props: {
  tableId: string, params: IGetRecordsByPageParams,
  /** 达到此数量后即可停止加载，默认 10000 * 10 */
  count?: number,

  updadeProgress?: (props: { current: number, total: number, notSupport?: boolean }) => void;
  bitableRef: React.MutableRefObject<typeof bitableSdk | null>;
}) {
  const { tableId, params, count = 10000 * 10, updadeProgress, bitableRef } = props;

  let hasMore = true;
  let records: IRecord[] = [];
  let pageToken = undefined;

  const isMobile = getIsMobile();
  const table = await bitableRef.current?.base.getTableById(tableId);

  while (hasMore && table) {
    const res = await table?.getRecordsByPage({
      ...params,
      pageToken,
    });
    const total = res?.total || 0;
    if (isMobile && total > 2000) {
      hasMore = false;
      updadeProgress?.({ current: records.length, total, notSupport: true });
      return records;
    }
    records = records.concat(res?.records || []);
    updadeProgress?.({ current: records.length, total: res?.total || 0 });
    hasMore = res?.hasMore || false;
    pageToken = res?.pageToken;
    if (records.length >= count) {
      break;
    }
  }
  return records;
}