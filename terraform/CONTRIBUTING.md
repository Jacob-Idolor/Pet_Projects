# Contributing

Thanks for improving the Terraform Learning Lab.

## What to contribute

- Curriculum clarifications
- New troubleshooting scenarios
- Example stacks (with `terraform validate` passing)
- Simulator command coverage
- Runbooks from real incidents

## Standards

1. Run `make validate-all` before opening a PR
2. Run `cd site && npm run build` if you change the site
3. Match existing tone: practice-first, production-aware
4. No secrets in committed files — use `.example` suffix for tfvars
5. Keep examples minimal — one concept per lab

## Local checks

```bash
cd terraform
make check-tools
make validate-all
make site-build
```

## File layout for new labs

```
labs/lab-XX-name/
└── README.md    # Step-by-step with expected output
```

Add a `make lab-XX` target in the Makefile and a case in `scripts/bootstrap-lab.sh`.
