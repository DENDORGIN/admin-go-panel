package entities

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Tenant struct {
	ID         uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name       string    `gorm:"unique;not null" json:"name"`
	Domain     string    `gorm:"unique;not null" json:"domain"`
	DBHost     string    `json:"db_host"`
	DBPort     string    `json:"db_port"`
	DBUser     string    `json:"db_user"`
	DBPassword string    `json:"db_password"`
	DBName     string    `json:"db_name"`
	Migrated   bool      `gorm:"default:false" json:"migrated"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (tenant *Tenant) BeforeCreate(*gorm.DB) error {
	tenant.ID = uuid.New()
	return nil
}

type User struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	FullName    string    `gorm:"not null" json:"fullName"`
	Avatar      string    `gorm:"default:null" json:"avatar"`
	Email       string    `gorm:"unique;not null" json:"email"`
	Password    string    `gorm:"not null" json:"password"`
	IsActive    bool      `gorm:"default:true" json:"isActive"`
	IsSuperUser bool      `gorm:"default:false" json:"isSuperUser"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (user *User) BeforeCreate(*gorm.DB) error {
	user.ID = uuid.New()
	return nil
}

type Items struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Title     string    `gorm:"not null" json:"title"`
	Content   string    `gorm:"not null" json:"content"`
	Price     float64   `gorm:"not null" json:"price"`
	Quantity  int       `gorm:"not null" json:"quantity"`
	Position  int       `gorm:"not null" json:"position"`
	Language  string    `gorm:"not null" json:"language"`
	ItemUrl   string    `gorm:"default:null" json:"item_url"`
	Category  string    `gorm:"default:null" json:"category"`
	Status    bool      `gorm:"default:false" json:"status"`
	OwnerID   uuid.UUID `gorm:"not null;index" json:"-"`
	User      User      `gorm:"foreignKey:OwnerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (item *Items) BeforeCreate(*gorm.DB) error {
	item.ID = uuid.New()
	return nil
}

type Property struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Height    string    `gorm:"default:null" json:"height"`
	Width     string    `gorm:"default:null" json:"width"`
	Weight    string    `gorm:"default:null" json:"weight"`
	Color     string    `gorm:"default:null" json:"color"`
	Material  string    `gorm:"default:null" json:"material"`
	Brand     string    `gorm:"default:null" json:"brand"`
	Size      string    `gorm:"default:null" json:"size"`
	Motif     string    `gorm:"default:null" json:"motif"`
	Style     string    `gorm:"default:null" json:"style"`
	ContentId uuid.UUID `gorm:"type:uuid;" json:"content_id"`
}

func (property *Property) BeforeCreate(*gorm.DB) error {
	property.ID = uuid.New()
	return nil
}

type Blog struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Title     string    `gorm:"not null" json:"title"`
	Content   string    `gorm:"not null" json:"content"`
	Position  int       `gorm:"not null" json:"position"`
	Language  string    `gorm:"not null" json:"language"`
	Status    bool      `gorm:"default:false" json:"status"`
	OwnerID   uuid.UUID `gorm:"not null;index" json:"-"`
	User      User      `gorm:"foreignKey:OwnerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (blog *Blog) BeforeCreate(*gorm.DB) error {
	blog.ID = uuid.New()
	return nil
}

type Calendar struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Title          string    `gorm:"not null" json:"title"`
	Description    string    `gorm:"default:null" json:"description"`
	StartDate      time.Time `gorm:"not null" json:"startDate"`
	EndDate        time.Time `gorm:"not null" json:"endDate"`
	ReminderOffset int       `gorm:"default:0" json:"reminderOffset"`
	AllDay         bool      `gorm:"not null" json:"allDay"`
	Color          string    `gorm:"not null" json:"color"`
	WorkingDay     bool      `gorm:"default false" json:"workingDay"`
	SickDay        bool      `gorm:"default false" json:"sickDay"`
	Vacation       bool      `gorm:"default false" json:"vacation"`
	Weekend        bool      `gorm:"default false" json:"weekend"`
	SendEmail      bool      `gorm:"default false" json:"sendEmail"`
	ReminderSent   bool      `gorm:"default false" json:"reminderSent"`
	UserID         uuid.UUID `gorm:"not null;index" json:"-"`
	User           User      `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user"`
}

func (c *Calendar) BeforeCreate(*gorm.DB) error {
	c.ID = uuid.New()
	return nil
}

type Media struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ContentId uuid.UUID `gorm:"type:uuid;" json:"content_id"`
	Url       string    `gorm:"type:string" json:"url"`
	Type      string    `gorm:"type:string" json:"type"`
	CreatedAt time.Time `gorm:"type:time" json:"created_at"`
}

func (media *Media) BeforeCreate(*gorm.DB) error {
	media.ID = uuid.New()
	return nil
}

type Messages struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserId    uuid.UUID `gorm:"type:uuid;" json:"user_id"`
	RoomId    uuid.UUID `gorm:"type:uuid;" json:"room_id"`
	Message   string    `gorm:"type:string" json:"message"`
	CreatedAt time.Time `gorm:"type:time" json:"created_at"`
	UpdatedAt time.Time
	EditedAt  *time.Time `gorm:"type:timestamp"`
	User      User       `gorm:"foreignKey:UserId;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}

func (message *Messages) BeforeCreate(*gorm.DB) error {
	if message.ID == uuid.Nil {
		message.ID = uuid.New()
	}
	return nil
}

type Reaction struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	UserId    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	MessageID uuid.UUID `gorm:"type:uuid;not null" json:"message_id"`
	Emoji     string    `gorm:"type:text;not null" json:"emoji"`
	CreatedAt time.Time `json:"created_at"`
}

func (emoji *Reaction) BeforeCreate(*gorm.DB) error {
	if emoji.ID == uuid.Nil {
		emoji.ID = uuid.New()
	}
	return nil
}

type ChatRooms struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	NameRoom    string     `gorm:"not null" json:"name_room"`
	Description string     `gorm:"type:string" json:"description"`
	Image       string     `gorm:"not null" json:"image"`
	Status      bool       `gorm:"default:false" json:"status"`
	IsChannel   bool       `gorm:"default:false" json:"is_channel"`
	OwnerId     uuid.UUID  `gorm:"type:uuid;" json:"owner_id"`
	CreatedAt   time.Time  `gorm:"type:time" json:"created_at"`
	Messages    []Messages `gorm:"foreignKey:RoomId;constraint:OnDelete:CASCADE" json:"messages"`
}

func (chatRoom *ChatRooms) BeforeCreate(*gorm.DB) error {
	chatRoom.ID = uuid.New()
	return nil
}

type DirectMessage struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ConversationID uuid.UUID `gorm:"not null"`
	SenderID       uuid.UUID `gorm:"type:uuid;not null"`
	Text           string    `gorm:"type:text;not null"`
	Read           bool      `gorm:"default:false"`
	CreatedAt      time.Time

	Sender       User          `gorm:"foreignKey:SenderID"`
	Conversation Conversations `gorm:"foreignKey:ConversationID"`
}

func (dm *DirectMessage) BeforeCreate(*gorm.DB) error {
	dm.ID = uuid.New()
	return nil
}

type Conversations struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	User1ID   uuid.UUID `gorm:"type:uuid;not null"`
	User2ID   uuid.UUID `gorm:"type:uuid;not null"`
	CreatedAt time.Time

	User1 User `gorm:"foreignKey:User1ID"`
	User2 User `gorm:"foreignKey:User2ID"`

	DirectMessage []DirectMessage `gorm:"foreignKey:ConversationID"`
}

func (c *Conversations) BeforeCreate(*gorm.DB) error {
	c.ID = uuid.New()
	return nil
}
