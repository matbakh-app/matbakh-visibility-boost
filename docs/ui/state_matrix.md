# UI State Matrix

## Standard States
VCResult(standard), success, result_ready, —, —, —, vc_result_view
VCResult(standard), error, api_error, —, —, —, vc_result_error

## Invisible UI States
VCResult(invisible), success, result_ready, —, —, —, inv_answer_view
VCResult(invisible), expand_details, user_click, —, —, —, —