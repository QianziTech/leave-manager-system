/**
 * 中英文映射常量
 * 用于各模块统一展示中文标签
 */

/** 用户角色中文映射 */
export const roleLabels: Record<string, string> = {
  employee: '员工',
  supervisor: '主管',
  dept_head: '部门经理',
  admin: '管理员',
}

/** 假期类型中文映射 */
export const leaveTypeLabels: Record<string, string> = {
  sick: '病假',
  personal: '事假',
  annual: '年假',
  other: '其他',
}

/** 假期状态中文映射 */
export const leaveStatusLabels: Record<string, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  withdrawn: '已撤回',
}

/** 审批决策中文映射 */
export const decisionLabels: Record<string, string> = {
  approved: '通过',
  rejected: '拒绝',
}

/** 审批级别中文映射 */
export const approvalLevelLabels: Record<string, string> = {
  1: '一级审批（主管）',
  2: '二级审批（部门经理）',
}

/** 用户状态中文映射 */
export const userStatusLabels: Record<string, string> = {
  active: '在职',
  inactive: '离职',
}