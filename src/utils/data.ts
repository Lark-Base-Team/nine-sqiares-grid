import { bitable, IGetRecordsByPageParams, IRecord } from "@lark-base-open/js-sdk";

export async function loadTableRecords(props: {
  tableId: string, params: IGetRecordsByPageParams,
  /** 达到此数量后即可停止加载，默认 10000 * 10 */
  count?: number,

  updadeProgress?: (props: { current: number, total: number }) => void
}) {
  const { tableId, params, count = 10000 * 10, updadeProgress } = props;

  let hasMore = true;
  let records: IRecord[] = [];
  let pageToken = undefined;

  const table = await bitable.base.getTableById(tableId);

  while (hasMore) {
    const res = await table.getRecordsByPage({
      ...params,
      pageToken,
    });
    records = records.concat(res.records);
    updadeProgress?.({ current: records.length, total: res.total });
    hasMore = res.hasMore;
    pageToken = res.pageToken;
    if (records.length >= count) {
      break;
    }
  }
  return records;
}