# Broken manifests for troubleshooting practice

Apply these in namespace `troubleshoot`. Fix them without peeking at solutions in [drills/troubleshooting-scenarios.md](../../drills/troubleshooting-scenarios.md) until you've tried.

| File | Symptom | Fix hint |
|------|---------|----------|
| scenario-01-crashloop.yaml | CrashLoopBackOff | Container exits immediately |
| scenario-02-no-endpoints.yaml | Service has no endpoints | Label/selector mismatch |
| scenario-03-imagepull.yaml | ImagePullBackOff | Invalid image tag |
| scenario-04-config.yaml | Config not loaded | Wrong env key reference |
| scenario-05-pending.yaml | Pod Pending | Absurd resource requests |

After fixing, consider what alert or dashboard would catch this in production.
