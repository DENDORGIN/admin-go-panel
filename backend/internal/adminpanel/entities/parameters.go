package entities

type Parameters struct {
	Language string
	Skip     int
	Limit    int
}

type EmailConfig struct {
	SMTPHost string
	SMTPPort int
	Username string
	Password string
	From     string
}
