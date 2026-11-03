# AI Infra 日报同步

数据源是 `personal_agents/ai-infra-agent/reports/YYYY-MM-DD.md`，不读取邮箱或发信凭证。
`config/repos.json` 和 `pipeline/fetch.py` 仅用于导出公开来源配置。

完整日报的 L1 分支运行 `sync_reports.py`：先校验并导出最近 14 期，再在独立 checkout
提交 `assets/data/ai_infra/`，推送到显式指定的远端分支。内容未变不提交；并发执行会退出；
推送失败最多重试三次，每次重新取得远端版本，不强推。失败写入现有日报日志，下一次运行可补推。
最新报告未完成、生成中或降级时停止发布；历史中的此类报告跳过，继续取更早的完整日报，
避免一次失败阻塞后续更新。远端已有更新日期的数据时拒绝回退。

正式目标为 `master`，数据推送会触发现有网站部署流程。开发验证时应显式指定功能分支。
任务依赖本机开机、登录和现有日报任务成功完成。

安装或更新 hook（幂等；只修改 `run.sh` 的 L1 成功分支，不修改定时任务）：

```sh
/usr/bin/python3 tools/ai_infra/sync_reports.py \
  --agent-dir ../personal_agents/ai-infra-agent \
  --state-dir "$HOME/.cache/ai-infra-website-sync" \
  --remote git@github.com:ZhengWG/ZhengWG.github.io.git \
  --branch master --install-hook
```

手动重试使用相同命令，去掉 `--install-hook`。可添加 `--report-date YYYY-MM-DD`，要求最新日期匹配。
hook 使用安装时的 Python 和脚本绝对路径；移动仓库后需重新安装。Git 使用本机已有 SSH 登录身份，
不交互询问密码；无人值守时也需可用。同步目录必须由本工具创建，不能指向正在开发的仓库。

仅导出到当前工作区：

```sh
python3 tools/ai_infra/export_reports.py --agent-dir ../personal_agents/ai-infra-agent
```

验证（本地临时 Git 仓库，不访问 GitHub）：

```sh
env -i PATH=/usr/bin:/bin:/usr/sbin:/sbin /usr/bin/python3 -m unittest discover -s tools/ai_infra -p 'test_*.py' -v
```
