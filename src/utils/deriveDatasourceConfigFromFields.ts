import type { IDatasourceConfigType } from '../store';

/**
 * 根据表字段元信息，推导/补全九宫格渲染所需的 `datasourceConfig`。
 *
 * 场景：创建/配置态下，用户还没手动选择字段时，尝试从字段列表里“猜”出：
 * - 人员字段（type=11）
 * - 横轴/竖轴单选字段（type=3）
 * 并给横纵轴默认选中一些 optionIds。
 *
 * 注意：该函数保持与原逻辑一致：
 * - 如果横轴 options 长度为 1 或 2，会提前 return（不会继续处理竖轴）。
 */
export function deriveDatasourceConfigFromFields(
  fields: any[],
  config: IDatasourceConfigType,
): IDatasourceConfigType {
  const nextConfig: IDatasourceConfigType = {
    ...config,
    horizontalCategories: { ...config.horizontalCategories },
    verticalCategories: { ...config.verticalCategories },
  };

  // 1) 自动选择人员字段（人员字段 type=11）
  const userFields = fields.filter((field) => field.type === 11);
  const userField: any = userFields[0];
  if (userField?.id) {
    nextConfig.personnelField = userField.id;
  }

  // 2) 自动选择横轴/竖轴字段（单选字段 type=3），并给默认分类
  const optionFields = fields.filter((field) => field.type === 3);
  const horizontalField: any = optionFields[0];
  if (horizontalField?.id) {
    nextConfig.horizontalField = horizontalField.id;
  }
  if (horizontalField?.property?.options) {
    // 通过浅拷贝避免污染原始字段 options（函数对外保持无副作用）
    const options = (horizontalField.property.options as any[]).map((item) => ({
      ...item,
      disabled: false,
    }));
    if (options.length === 1) {
      options[0].disabled = true;
      nextConfig.horizontalCategories.left = [options[0].id];
      return nextConfig;
    } else if (options.length === 2) {
      options[0].disabled = true;
      nextConfig.horizontalCategories.left = [options[0].id];
      options[1].disabled = true;
      nextConfig.horizontalCategories.middle = [options[1].id];
      return nextConfig;
    } else if (options.length >= 3) {
      options[0].disabled = true;
      nextConfig.horizontalCategories.left = [options[0].id];
      options[Math.floor(options.length / 2)].disabled = true;
      nextConfig.horizontalCategories.middle = [
        options[Math.floor(options.length / 2)].id,
      ];
      options[options.length - 1].disabled = true;
      nextConfig.horizontalCategories.right = [options[options.length - 1].id];
    }
  }

  const verticalField: any = optionFields[1];
  if (verticalField?.id) {
    nextConfig.verticalField = verticalField.id;
  }
  if (verticalField?.property?.options) {
    // 通过浅拷贝避免污染原始字段 options（函数对外保持无副作用）
    const options = (verticalField.property.options as any[]).map((item) => ({
      ...item,
      disabled: false,
    }));
    if (options.length === 1) {
      options[0].disabled = true;
      nextConfig.verticalCategories.up = [options[0].id];
      return nextConfig;
    } else if (options.length === 2) {
      options[0].disabled = true;
      nextConfig.verticalCategories.up = [options[0].id];
      options[1].disabled = true;
      nextConfig.verticalCategories.middle = [options[1].id];
      return nextConfig;
    } else if (options.length >= 3) {
      options[0].disabled = true;
      nextConfig.verticalCategories.up = [options[0].id];
      options[Math.floor(options.length / 2)].disabled = true;
      nextConfig.verticalCategories.middle = [
        options[Math.floor(options.length / 2)].id,
      ];
      options[options.length - 1].disabled = true;
      nextConfig.verticalCategories.down = [options[options.length - 1].id];
    }
  }
  return nextConfig;
}
