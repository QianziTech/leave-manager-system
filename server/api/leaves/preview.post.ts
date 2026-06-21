import { getDb } from '../../utils/db'
import { assertApprovalFlowReady, resolveApprovalFlow } from '../../utils/approvalFlow'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const { duration } = await readBody(event)

  if (!duration || duration < 0.5) {
    throw createError({ statusCode: 400, statusMessage: '请提供有效的请假天数' })
  }

  const db = getDb()
  const flow = resolveApprovalFlow(db, userId, duration)
  assertApprovalFlowReady(flow)

  return {
    levels: flow.levels,
    needMultiLevel: flow.needMultiLevel,
    threshold: flow.threshold,
    applicantName: flow.user.real_name,
    departmentName: flow.user.department_name,
  }
})
